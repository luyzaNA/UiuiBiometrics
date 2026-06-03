import uuid

from src.http_handlers.create_food_menu_request import CreateFoodMenuRequest
from src.models.menu.food_based_menu import FoodRecommendationModel
from src.repositories.food_menu_repository import FoodMenuRepository
from src.services.assessment_service import AssessmentService
from src.utils.enums import MenuStatus, MenuType
from src.utils.time import current_millis
from src.utils.logger import get_logger

logger = get_logger(__name__)

class FoodMenuService:
    """
    Food Menu Service
    Handles business logic for generating, retrieving, and managing the lifecycle
    of AI-generated food-based nutritional protocols based on user assessments.
    """

    def __init__(self):
        self.food_menu_repository = FoodMenuRepository()
        self.assessment_service = AssessmentService()

    def create_food_menu(self, request: CreateFoodMenuRequest, cognito_sub: str) -> FoodRecommendationModel:
        """Processes AI output to create a new food recommendation."""
        current_date: int = current_millis()
        new_menu_id = uuid.uuid4()

        logger.info(f"[FOOD_MENU_SERVICE] Creating new recommendation {new_menu_id} for user {cognito_sub}")

        assessment = self.assessment_service.get_assessment_by_id(
            str(request.assessment_id),
            cognito_sub
        )
        new_food_menu = FoodRecommendationModel(
            pk=f"USER#{cognito_sub}",
            sk=f"MENU#{new_menu_id}",
            menu_id=new_menu_id,
            assessment_id=request.assessment_id,
            cognito_sub=cognito_sub,

            recommendation_type=MenuType.FOOD_ITEMS,
            status=MenuStatus.DRAFT,
            review_after_days=request.review_after_days,

            menu_type=MenuType.FOOD_ITEMS,
            target_person=assessment.target_person,

            doctor_id=None,
            doctor_modifications=None,
            payment_reference=None,

            deficiency_targets=request.deficiency_targets,

            created_at=current_date,
            updated_at=current_date
        )

        return self.food_menu_repository.create_food_menu(new_food_menu)

    def get_active_protocol_for_person(self, cognito_sub: str, target_person: str) -> FoodRecommendationModel | None:
        logger.info(f"[FOOD_MENU_SERVICE] Fetching active menu for {cognito_sub} - {target_person}")
        return self.food_menu_repository.get_active_menu_by_target(cognito_sub, target_person)

    def get_history_by_person(self, cognito_sub: str, target_person: str) -> list[FoodRecommendationModel]:
        logger.info(f"[FOOD_MENU_SERVICE] Fetching menu history for {cognito_sub} - {target_person}")
        return self.food_menu_repository.get_all_menus_by_target(cognito_sub, target_person)

    def activate_menu(self, menu_id: uuid.UUID, cognito_sub: str) -> FoodRecommendationModel:
        """Transitions a menu status from DRAFT to ACTIVE and archives any previously ACTIVE menu."""
        from src.http_handlers.exceptions import NotFoundException

        menu = self.food_menu_repository.get_menu_by_id(cognito_sub, menu_id)
        if not menu:
            logger.warning(f"[FOOD_MENU_SERVICE] Menu {menu_id} not found for user {cognito_sub}")
            raise NotFoundException("Menu not found")

        current_date = current_millis()

        all_menus = self.food_menu_repository.get_all_menus_by_target(cognito_sub, menu.target_person)
        for existing_menu in all_menus:
            if existing_menu.status == MenuStatus.ACTIVE and str(existing_menu.menu_id) != str(menu_id):
                logger.info(f"[FOOD_MENU_SERVICE] Archiving previously active menu {existing_menu.menu_id} for {menu.target_person}.")

                existing_menu.status = MenuStatus.ARCHIVED
                existing_menu.updated_at = current_date

                if existing_menu.gsi2_pk and existing_menu.gsi2_sk:
                    existing_menu.gsi2_sk = f"STATUS#{MenuStatus.ARCHIVED.value}#{existing_menu.created_at}"

                self.food_menu_repository.create_food_menu(existing_menu)

        menu.status = MenuStatus.ACTIVE
        menu.updated_at = current_date

        if menu.gsi2_pk and menu.gsi2_sk:
            menu.gsi2_sk = f"STATUS#{MenuStatus.ACTIVE.value}#{menu.created_at}"

        logger.info(f"[FOOD_MENU_SERVICE] Transitioning menu {menu_id} to ACTIVE status.")

        return self.food_menu_repository.create_food_menu(menu)
