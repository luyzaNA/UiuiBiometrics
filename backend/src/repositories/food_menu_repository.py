from uuid import UUID
from boto3.dynamodb.conditions import Key, Attr
from src.models.menu.food_based_menu import FoodRecommendationModel
from src.repositories.base_repository import BaseRepository
from src.utils.enums import MenuStatus, MenuType
from src.utils.settings import UIUI_BIOMETRICS_TABLE

class FoodMenuRepository(BaseRepository):
    """Repository for managing food-based target recommendations using explicit mapping."""

    def __init__(self) -> None:
        table_name: str | None = UIUI_BIOMETRICS_TABLE
        if not table_name:
            raise ValueError("UIUI_BIOMETRICS_TABLE environment variable is not set")
        self._table_name = table_name
        super().__init__()

    def create_food_menu(self, menu: FoodRecommendationModel) -> FoodRecommendationModel:
        """Create a new food recommendation record mapping nested deficiency models explicitly."""
        serialized_targets = [target.model_dump() for target in menu.deficiency_targets]

        self.table.put_item(
            Item={
                self.pk_key: menu.pk,
                self.sk_key: menu.sk,
                "gsi2_pk": menu.gsi2_pk,
                "gsi2_sk": menu.gsi2_sk,
                "menu_id": str(menu.menu_id),
                "assessment_id": str(menu.assessment_id),
                "cognito_sub": menu.cognito_sub,
                "target_person": menu.target_person,
                "menu_type": menu.recommendation_type.value,
                "status": menu.status.value,
                "review_after_days": menu.review_after_days,

                "doctor_id": menu.doctor_id,
                "doctor_modifications": menu.doctor_modifications,
                "payment_reference": menu.payment_reference,

                "deficiency_targets": serialized_targets,

                "created_at": menu.created_at,
                "updated_at": menu.updated_at,
            }
        )
        return menu

    def get_active_menu_by_target(self, cognito_sub: str, target_person: str) -> FoodRecommendationModel | None:
        pk = f"USER#{cognito_sub}"

        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(pk) & Key(self.sk_key).begins_with("MENU#"),
            FilterExpression=Attr("target_person").eq(target_person) & Attr("status").eq(MenuStatus.ACTIVE.value)
        )

        items = response.get("Items", [])
        if not items:
            return None

        items.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return self.convert_to_food_menu_model(items[0])

    def get_all_menus_by_target(self, cognito_sub: str, target_person: str) -> list[FoodRecommendationModel]:
        pk = f"USER#{cognito_sub}"

        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(pk) & Key(self.sk_key).begins_with("MENU#"),
            FilterExpression=Attr("target_person").eq(target_person)
        )
        items = response.get("Items", [])

        items.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return [self.convert_to_food_menu_model(item) for item in items]

    def convert_to_food_menu_model(self, item: dict) -> FoodRecommendationModel:
        """Convert DynamoDB dictionary back to FoodRecommendationModel Pydantic object."""
        return FoodRecommendationModel(
            pk=item.get(self.pk_key),
            sk=item.get(self.sk_key),
            gsi2_pk=item.get("gsi2_pk"),
            gsi2_sk=item.get("gsi2_sk"),
            menu_id=UUID(item.get("menu_id")),
            assessment_id=UUID(item.get("assessment_id")),
            cognito_sub=item.get("cognito_sub"),
            target_person=item.get("target_person", "Unknown"),
            recommendation_type=MenuType(item.get("menu_type")),
            status=MenuStatus(item.get("status", MenuStatus.DRAFT.value)),
            review_after_days=int(item.get("review_after_days", 0)),

            doctor_id=item.get("doctor_id"),
            doctor_modifications=item.get("doctor_modifications"),
            payment_reference=item.get("payment_reference"),

            deficiency_targets=item.get("deficiency_targets", []),

            created_at=int(item.get("created_at", 0)),
            updated_at=int(item.get("updated_at", 0)),
            menu_type=MenuType.FOOD_ITEMS
        )

    def get_menu_by_id(self, cognito_sub: str, menu_id: UUID) -> FoodRecommendationModel | None:
        """Retrieve a specific menu session by its ID within a user partition."""
        pk = f"USER#{cognito_sub}"
        sk = f"MENU#{menu_id}"

        response = self.table.get_item(
            Key={
                self.pk_key: pk,
                self.sk_key: sk
            }
        )
        item = response.get("Item")
        if not item:
            return None

        return self.convert_to_food_menu_model(item)