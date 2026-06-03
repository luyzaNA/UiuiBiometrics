import json
import os
import time
import concurrent.futures
from json import JSONDecodeError
import openai
from openai import OpenAI
from pydantic import ValidationError

from src.auth.auth import inject_user, require_role_categories, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.http_handlers.create_food_menu_request import CreateFoodMenuRequest
from src.models.menu.food_based_menu import FoodRecommendationModel, DeficiencyTargetDef

from src.models.user import User
from src.utils.calculate_review_after_days import calculate_review_days
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger
from src.utils.service_loader import get_food_menu_service

logger = get_logger(__name__)

API_KEY = os.environ.get("VISION_API_KEY")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://llm.wavespeed.ai/v1"
)

def fetch_chunk_recommendations(chunk_deficiencies, foods_count_rule) -> list:
    """
    Helper function that calls OpenAI for a specific subset (chunk) of deficiencies.
    Includes an exponential backoff mechanism to handle 429 Rate Limits gracefully.
    """
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
    delay = 2  # Secunde inițiale de așteptare la eșec

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=4000,
                temperature=0.2
            )
            ai_response_text = response.choices[0].message.content.strip()
            generated_data = json.loads(ai_response_text)
            return generated_data.get("deficiencies", [])

        except openai.RateLimitError as e:
            if attempt == max_retries - 1:
                logger.error("[FETCH_CHUNK] Rate limit exceeded permanently after %s retries.", max_retries)
                raise e
            logger.warning("[FETCH_CHUNK] 429 Rate Limit hit. Retrying in %s seconds... (Attempt %s/%s)", delay, attempt + 1, max_retries)
            time.sleep(delay)
            delay *= 2  # Dublăm timpul de așteptare (Exponential backoff)

        except Exception as e:
            logger.error("[FETCH_CHUNK] Unexpected error inside thread: %s", str(e))
            raise e

@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """
    Handler for POST /menu/food endpoint.
    """
    try:
        logger.info("[CREATE_FOOD_MENU] Started for Cognito Sub: %s", user.sub)

        if not API_KEY:
            logger.error("[CREATE_FOOD_MENU] VISION_API_KEY missing in environment variables.")
            return internal_server_error("Server configuration error (API Key missing).")

        body_dict = json.loads(event.get("body") or "{}")

        deficiencies_list = body_dict.get("deficiencies", [])
        assessment_id = body_dict.get("assessment_id")

        if not assessment_id or not deficiencies_list:
            return bad_request("Missing 'assessment_id' or 'deficiencies' array in request body.")

        review_after_days = calculate_review_days(deficiencies_list)
        num_carente = len(deficiencies_list)
        foods_count_rule = "1-2 foods" if num_carente > 5 else "2-3 foods"

        logger.info("[CREATE_FOOD_MENU] Processing %s deficiencies. Rule: %s", num_carente, foods_count_rule)

        # --- LOGICĂ DE CHUNKING ȘI PARALELISM OPTIMIZATĂ ---
        CHUNK_SIZE = 4
        chunks = [deficiencies_list[i:i + CHUNK_SIZE] for i in range(0, num_carente, CHUNK_SIZE)]

        all_generated_targets_raw = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_to_chunk = {
                executor.submit(fetch_chunk_recommendations, chunk, foods_count_rule): chunk
                for chunk in chunks
            }

            for future in concurrent.futures.as_completed(future_to_chunk):
                try:
                    chunk_result = future.result()
                    all_generated_targets_raw.extend(chunk_result)
                except Exception as exc:
                    logger.error("[CREATE_FOOD_MENU] A chunk processing generated an exception: %s", exc)
                    raise exc

                    # Validăm rezultatele unificate cu Pydantic
        validated_deficiency_targets = [
            DeficiencyTargetDef(**target)
            for target in all_generated_targets_raw
        ]

        menu_request = CreateFoodMenuRequest(
            assessment_id=assessment_id,
            review_after_days=review_after_days,
            deficiency_targets=validated_deficiency_targets
        )

        menu: FoodRecommendationModel = get_food_menu_service().create_food_menu(
            request=menu_request,
            cognito_sub=user.sub
        )

        logger.info("[CREATE_FOOD_MENU] Unified food recommendation created and saved for Sub: %s", user.sub)

        return ok(data=menu.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except JSONDecodeError:
        logger.exception("[CREATE_FOOD_MENU] Failed. AI engine output or request body is not valid JSON.")
        return bad_request("The generated protocol structure failed JSON parse validation. Please retry.")
    except ValidationError as e:
        logger.exception("[CREATE_FOOD_MENU] Failed. Pydantic validation rejected AI structural output.")
        return bad_request(f"Data structure integrity violation: {str(e)}")
    except Exception as e:
        logger.exception("[CREATE_FOOD_MENU] Unexpected internal service error: %s", str(e))
        return internal_server_error("An unexpected error occurred while processing the nutritional protocol.")