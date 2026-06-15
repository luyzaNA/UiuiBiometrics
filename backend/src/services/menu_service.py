import json
import os
import time
import uuid
import concurrent.futures
from typing import List, Optional, Union

import openai
from openai import OpenAI
from src.models.menu.meal_base_menu import MealBaseMenuModel, MealOptionDef
from src.models.menu.food_base_menu import FoodBaseMenuModel, DeficiencyTargetDef
from src.repositories.menu_repository import MenuRepository
from src.services.assessment_service import AssessmentService
from src.services.notification_service import NotificationService

from src.utils.calculate_review_after_days import calculate_review_days
from src.utils.enums import MenuStatus, MenuType, NotificationType
from src.utils.time import current_millis
from src.utils.logger import get_logger

logger = get_logger(__name__)


class MenuService:
    """
    Unified service managing business logic, AI generation, and persistence
    for all nutritional menu types (Food Items & Meals).
    """

    API_KEY = os.environ.get("VISION_API_KEY")

    client = OpenAI(
        api_key=API_KEY,
        base_url="https://llm.wavespeed.ai/v1"
    )

    def __init__(self):
        self.repository = MenuRepository()
        self.assessment_service = AssessmentService()
        self.notification_service = NotificationService()


    def generate_and_create_food_menu(self, assessment_id: str, deficiencies_list: list, cognito_sub: str) -> FoodBaseMenuModel:
        if not self.API_KEY:
            raise ValueError("VISION_API_KEY missing in environment variables.")

        review_after_days = calculate_review_days(deficiencies_list)
        num_deficiencies = len(deficiencies_list)
        foods_count_rule = "1-2 foods" if num_deficiencies > 5 else "2-3 foods"

        logger.info(f"[MENU_SERVICE] Processing {num_deficiencies} deficiencies. Rule: {foods_count_rule}")

        CHUNK_SIZE = 4
        chunks = [deficiencies_list[i:i + CHUNK_SIZE] for i in range(0, num_deficiencies, CHUNK_SIZE)]
        all_generated_targets_raw = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_to_chunk = {
                executor.submit(self._fetch_food_chunk, chunk, foods_count_rule): chunk
                for chunk in chunks
            }

            for future in concurrent.futures.as_completed(future_to_chunk):
                try:
                    chunk_result = future.result()
                    all_generated_targets_raw.extend(chunk_result)
                except Exception as exc:
                    logger.error(f"[MENU_SERVICE] A chunk processing generated an exception: {exc}")
                    raise exc

        validated_deficiency_targets = [
            DeficiencyTargetDef(**target) for target in all_generated_targets_raw
        ]

        return self._create_food_menu_record(
            assessment_id=assessment_id,
            review_after_days=review_after_days,
            deficiency_targets=validated_deficiency_targets,
            cognito_sub=cognito_sub
        )

    def _fetch_food_chunk(self, chunk_deficiencies: list, foods_count_rule: str) -> list:
        prompt = f"""
        You are a clinical nutrition recommendation engine.
        
        TASK
        
        Generate food-based recommendations for correcting the following nutrient deficiencies:
        
        {json.dumps(chunk_deficiencies)}
        
        IMPORTANT
        
        * Return ONLY valid JSON.
        * No markdown backticks or wrappers.
        * No explanations outside JSON.
        * Do NOT calculate recovery timelines or reassessment periods.
        * Do NOT recommend supplements.
        * Prefer foods commonly available in Romania.
        * ALL user-visible text MUST be returned in BOTH English and Romanian.
        
        ROMANIAN FOOD PRIORITY
        
        eggs, chicken liver, beef liver, sardines, mackerel, herring, salmon, yogurt, kefir, cottage cheese, spinach, parsley, lentils, beans, chickpeas, oats, sunflower seeds, pumpkin seeds, walnuts, carrots, sweet potatoes, cabbage, broccoli, bell peppers, tomatoes, onions.
        
        RECOMMENDATION RULES
        
        * CRITICAL: Generate exactly {foods_count_rule} per deficiency.
        * Use realistic serving sizes.
        * CRITICAL: Use exact, numeric frequencies (e.g., "2-3 times weekly", "once weekly", "daily", "1-2 times weekly").
        * NEVER use vague phrases like "several times weekly", "multiple times a week", or "as needed".
        * Organ meats: maximum once weekly.
        * Tuna: maximum 1-2 times weekly.
        * Vegetables, seeds, dairy: daily or 2-4 times weekly.
        * Prioritize foods with the highest nutrient density.
        
        ABSORPTION RULES
        
        Avoid recommending antagonist nutrients in the same meal:
        * Iron ↔ Calcium
        * Zinc ↔ Calcium
        * Zinc ↔ Excess Copper
        * Iron ↔ High Magnesium
        * Vitamin E ↔ High Vitamin K
        
        Use food-based absorption boosters when beneficial:
        Iron: lemon juice, red bell pepper, parsley
        Calcium: salmon, egg yolk
        Fat-soluble vitamins (A,D,E,K): olive oil, avocado, walnuts
        
        ABSORPTION BOOSTERS RULES
        * Only real foods.
        * Maximum 3 items.
        * No generic terms.
        * Return [] if no specific booster is useful or necessary.
        
        LOCALIZATION RULES
        For every user-visible field return:
        {{
         "en": "...",
         "ro": "..."
        }}
        Apply this to: deficiency_name, food_name, frequency, absorption_boosters
        DO NOT translate serving_size.
        
        JSON SCHEMA
        
        {{
          "deficiencies": [
            {{
              "deficiency_name": {{ "en": "Iron", "ro": "Fier" }},
              "recommended_foods": [
                {{
                  "food_name": {{ "en": "Chicken liver", "ro": "Ficat de pui" }},
                  "serving_size": "100 g",
                  "frequency": {{ "en": "Once weekly", "ro": "O dată pe săptămână" }},
                  "absorption_boosters": [
                    {{ "en": "Red bell pepper", "ro": "Ardei gras roșu" }}
                  ]
                }}
              ]
            }}
          ]
        }}
        """

        max_retries = 3
        delay = 2

        for attempt in range(max_retries):
            try:
                logger.info("[DEBUG] Trimit cererea către Wavespeed API...")
                response = self.client.chat.completions.create(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    max_tokens=2000,
                    temperature=0.2
                )
                logger.info("[DEBUG] Am primit răspuns de la API!")
                ai_response_text = response.choices[0].message.content.strip()

                if ai_response_text.startswith("```json"):
                    ai_response_text = ai_response_text[7:-3].strip()
                elif ai_response_text.startswith("```"):
                    ai_response_text = ai_response_text[3:-3].strip()

                generated_data = json.loads(ai_response_text)
                return generated_data.get("deficiencies", [])

            except openai.RateLimitError as e:
                if attempt == max_retries - 1:
                    logger.error(f"[FETCH_FOOD_CHUNK] Rate limit exceeded permanently after {max_retries} retries.")
                    raise e
                logger.warning(f"[FETCH_FOOD_CHUNK] 429 Rate Limit hit. Retrying in {delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)
                delay *= 2

            except Exception as e:
                logger.error(f"[FETCH_FOOD_CHUNK] Unexpected error inside thread: {str(e)}")
                if attempt == max_retries - 1:
                    raise e
                time.sleep(delay)
                delay *= 2

    def _create_food_menu_record(self, assessment_id: str, review_after_days: int, deficiency_targets: List[DeficiencyTargetDef], cognito_sub: str) -> FoodBaseMenuModel:
        assessment = self.assessment_service.get_assessment_by_id(assessment_id, cognito_sub)
        new_menu_id = uuid.uuid4()
        now = current_millis()
        review_deadline_ms = now + 5000

        new_food_menu = FoodBaseMenuModel(
            pk=f"USER#{cognito_sub}",
            sk=f"MENU#{new_menu_id}",
            menu_id=new_menu_id,
            assessment_id=uuid.UUID(assessment_id),
            cognito_sub=cognito_sub,
            target_person=assessment.target_person,
            menu_type=MenuType.FOOD_ITEMS,
            status=MenuStatus.DRAFT,
            review_after_days=review_after_days,
            review_deadline=review_deadline_ms,
            deficiency_targets=deficiency_targets,
            created_at=current_millis(),
            updated_at=current_millis()
        )
        return self.repository.create_food_base_menu(new_food_menu)

    def generate_partial_meal_category(self, deficiencies_list: list, category: str) -> dict:
        """
        Generates EXACTLY 3 targeted meals for a single specific category (e.g., breakfast).
        Prevents context bloating, eliminates timeouts, and limits output tokens.
        """
        if not self.API_KEY:
            raise ValueError("VISION_API_KEY missing in environment variables.")

        category_map = {
            "breakfasts": "Breakfast",
            "lunches": "Lunch",
            "dinners": "Dinner",
            "snacks": "Snack"
        }
        human_readable_category = category_map.get(category, "Meal")

        prompt = f"""
            You are a clinical nutrition meal-planning engine.
            
            TASK
            
            Generate therapeutic meal options designed specifically to improve the following nutrient deficiencies:
            
            {json.dumps(deficiencies_list)}
            
            IMPORTANT
            
            * Return ONLY valid JSON.
            * No markdown wrappers or backticks.
            * No explanations outside JSON.
            * ALL user-visible text MUST be returned in BOTH English and Romanian.
            * Meals must be realistic recipes.
            * Prefer ingredients commonly available in Romania.
            * Do NOT recommend supplements.
            * Do NOT mention nutrient deficiencies directly in meal names.
            * Focus on food-based nutritional correction.
            
            MEAL GENERATION RULES
            
            Generate EXACTLY 6 {human_readable_category} choices for this single deficiency layout.
            The meals should collectively target the listed deficiencies using natural foods.
            
            ABSORPTION RULES
            
            Avoid combining strong nutrient antagonists in the same meal:
            * Iron ↔ Calcium
            * Zinc ↔ Calcium
            * Zinc ↔ Excess Copper
            * Iron ↔ High Magnesium
            
            LOCALIZATION RULES
            
            Every user-visible field must be localized:
            {{
              "en": "...",
              "ro": "..."
            }}
            Apply localization to: name, description, key_ingredients, instructions
            
            Do NOT localize: meal_id, prep_time_minutes
            
            DESCRIPTION RULES
            Description must briefly explain WHY the meal is beneficial.
            
            JSON SCHEMA
            
            {{
              "{category}": [
                {{
                  "meal_id": "{category.upper()[0]}_1",
                  "name": {{
                    "en": "Spinach Omelette with Parsley",
                    "ro": "Omletă cu Spanac și Pătrunjel"
                  }},
                  "description": {{
                    "en": "Rich in iron, vitamin A and high-quality protein to support blood levels.",
                    "ro": "Bogată în fier, vitamina A și proteine de înaltă calitate pentru susținerea nivelurilor sanguine."
                  }},
                  "prep_time_minutes": 10,
                  "key_ingredients": [
                    {{ "en": "Eggs", "ro": "Ouă" }},
                    {{ "en": "Spinach", "ro": "Spanac" }}
                  ],
                  "instructions": {{
                    "en": "Cook the eggs with spinach and finish with fresh parsley.",
                    "ro": "Gătește ouăle cu spanac și finalizează cu pătrunjel proaspăt."
                  }}
                }}
              ]
            }}
            """

        max_retries = 3
        delay = 2

        for attempt in range(max_retries):
            try:
                logger.info(f"[MENU_SERVICE] Requesting isolated category '{category}' from AI engine...")
                response = self.client.chat.completions.create(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    max_tokens=2500,
                    temperature=0.2
                )

                ai_response_text = response.choices[0].message.content.strip()

                if ai_response_text.startswith("```json"):
                    ai_response_text = ai_response_text[7:-3].strip()
                elif ai_response_text.startswith("```"):
                    ai_response_text = ai_response_text[3:-3].strip()

                return json.loads(ai_response_text)

            except json.JSONDecodeError as e:
                logger.error(f"[FETCH_PARTIAL_MEAL] JSON Decode Error on attempt {attempt + 1}: {str(e)}")
                if attempt == max_retries - 1:
                    raise e
                time.sleep(delay)
                delay *= 2
            except Exception as e:
                logger.error(f"[FETCH_PARTIAL_MEAL] Internal exception on attempt {attempt + 1}: {str(e)}")
                if attempt == max_retries - 1:
                    raise e
                time.sleep(delay)
                delay *= 2

    def save_assembled_meal_menu(self, assessment_id: str, deficiencies_list: list, full_menu_data: dict, cognito_sub: str) -> MealBaseMenuModel:
        """
        Saves the fully accumulated and stitched wizard data from the frontend interface directly to DynamoDB.
        """
        return self._create_meal_based_menu_record(
            assessment_id=assessment_id,
            deficiencies=deficiencies_list,
            ai_data=full_menu_data,
            cognito_sub=cognito_sub
        )

    def _create_meal_based_menu_record(self, assessment_id: str, deficiencies: list, ai_data: dict, cognito_sub: str) -> MealBaseMenuModel:
        assessment = self.assessment_service.get_assessment_by_id(assessment_id, cognito_sub)
        new_menu_id = uuid.uuid4()
        review_days = calculate_review_days(deficiencies)

        review_deadline_ms = current_millis() + (review_days * 24 * 60 * 60 * 1000)

        extracted_deficiencies = [
            d.get("name") for d in deficiencies if isinstance(d, dict) and d.get("name")
        ]

        new_meal_menu = MealBaseMenuModel(
            pk=f"USER#{cognito_sub}",
            sk=f"MENU#{new_menu_id}",
            menu_id=new_menu_id,
            assessment_id=uuid.UUID(assessment_id),
            cognito_sub=cognito_sub,
            target_person=assessment.target_person,
            menu_type=MenuType.MEALS,
            status=MenuStatus.DRAFT,
            review_after_days=review_days,
            review_deadline=review_deadline_ms,
            deficiencies=extracted_deficiencies,
            breakfasts=[MealOptionDef(**meal) for meal in ai_data.get("breakfasts", [])],
            lunches=[MealOptionDef(**meal) for meal in ai_data.get("lunches", [])],
            dinners=[MealOptionDef(**meal) for meal in ai_data.get("dinners", [])],
            snacks=[MealOptionDef(**meal) for meal in ai_data.get("snacks", [])],
            created_at=current_millis(),
            updated_at=current_millis()
        )
        return self.repository.create_meal_base_menu(new_meal_menu)

    def get_active_menu_by_target(self, cognito_sub: str, target_person: str) -> Optional[Union[MealBaseMenuModel, FoodBaseMenuModel]]:
        """
        Retrieves the currently active nutritional menu for a specific target person.
        """
        return self.repository.get_active_menu_by_target(cognito_sub, target_person)

    def get_all_menus_history(self, cognito_sub: str, target_person: Optional[str] = None) -> List[Union[MealBaseMenuModel, FoodBaseMenuModel]]:
        """
        Retrieves the full structural timeline of menus generated for a user.
        """
        return self.repository.get_all_menus_history(cognito_sub, target_person)

    def activate_menu(self, cognito_sub: str, menu_id: str, target_person: str) -> bool:
        """
        Activates a newly created menu while automatically archiving the old active ones.
        Parses the string menu_id into a UUID object for the repository.
        """
        try:
            menu_uuid = uuid.UUID(menu_id) if isinstance(menu_id, str) else menu_id
            return self.repository.activate_menu_for_target_person(
                cognito_sub=cognito_sub,
                menu_id=menu_uuid,
                target_person=target_person
            )
        except ValueError as ve:
            logger.error(f"[MENU_SERVICE] Invalid UUID format provided for menu_id: {menu_id}")
            raise ve

    def process_expired_menus(self) -> int:
        now = current_millis()
        expired_menus = self.repository.get_expired_active_menus(now)

        processed_count = 0
        for menu in expired_menus:
            user_pk = getattr(menu, 'pk', f"USER#{menu.cognito_sub}")
            menu_sk = getattr(menu, 'sk', f"MENU#{menu.menu_id}")

            try:
                self.repository.mark_menu_as_needs_review(user_pk, menu_sk)

                try:
                    self.notification_service.create_notification(
                        cognito_sub=menu.cognito_sub,
                        notif_type=NotificationType.RETAKE_QUIZ,
                        metadata={
                            "menuId":  str(menu.menu_id),
                            "cognitoSub": menu.cognito_sub,
                            "targetPerson" : menu.target_person
                        }
                    )
                except Exception as notify_err:
                    logger.error(f"[MENU_SERVICE] Failed to send expiration notification to {menu.cognito_sub}: {notify_err}")

                processed_count += 1
                logger.info(f"[MENU_SERVICE] Menu {menu_sk} processed and notification triggered for {menu.cognito_sub}.")

            except Exception as e:
                logger.error(f"[MENU_SERVICE] Failed to update menu {menu_sk}: {e}")

        return processed_count