from typing import List, Optional, Union
from uuid import UUID
from boto3.dynamodb.conditions import Key, Attr

from src.models.menu.meal_base_menu import MealBaseMenuModel
from src.models.menu.food_base_menu import FoodBaseMenuModel
from src.repositories.base_repository import BaseRepository
from src.utils.enums import MenuStatus, MenuType
from src.utils.settings import UIUI_BIOMETRICS_TABLE
from src.utils.time import current_millis


class MenuRepository(BaseRepository):
    """
    Unified repository managing all nutritional menu types (Food Items & Meals)
    within the single-table design framework.
    """

    def __init__(self) -> None:
        table_name: Optional[str] = UIUI_BIOMETRICS_TABLE
        if not table_name:
            raise ValueError("UIUI_BIOMETRICS_TABLE environment variable is not set")
        self._table_name = table_name
        super().__init__()

    def create_food_base_menu(self, menu: FoodBaseMenuModel) -> FoodBaseMenuModel:
        """Saves a Food Base Menu to DynamoDB."""
        return self._save_menu(menu)

    def create_meal_base_menu(self, menu: MealBaseMenuModel) -> MealBaseMenuModel:
        """Saves a Meal Bank Menu to DynamoDB."""
        return self._save_menu(menu)

    def _save_menu(self, menu: Union[MealBaseMenuModel, FoodBaseMenuModel]) -> Union[MealBaseMenuModel, FoodBaseMenuModel]:
        """
        Internal method to save any menu configuration to DynamoDB.
        Leverages Pydantic v2 JSON dumping to completely eliminate manual dictionary mapping.
        """
        item_data = menu.model_dump(mode="json")

        item_data[self.pk_key] = item_data.pop("pk")
        item_data[self.sk_key] = item_data.pop("sk")

        self.table.put_item(Item=item_data)
        return menu

    def get_menu_by_id(self, cognito_sub: str, menu_id: UUID) -> Optional[Union[MealBaseMenuModel, FoodBaseMenuModel]]:
        """Retrieves a specific menu by its unique ID within a user's partition."""
        response = self.table.get_item(
            Key={
                self.pk_key: f"USER#{cognito_sub}",
                self.sk_key: f"MENU#{menu_id}"
            }
        )
        return self._deserialize_item(response.get("Item"))

    def get_active_menu_by_target(self, cognito_sub: str, target_person: str) -> Optional[Union[MealBaseMenuModel, FoodBaseMenuModel]]:
        """Finds the currently ACTIVE menu configuration for a specific target person."""
        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(f"USER#{cognito_sub}") & Key(self.sk_key).begins_with("MENU#"),
            FilterExpression=Attr("target_person").eq(target_person) & Attr("status").eq(MenuStatus.ACTIVE.value)
        )
        items = response.get("Items", [])
        if not items:
            return None

        items.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return self._deserialize_item(items[0])

    def get_all_menus_history(self, cognito_sub: str, target_person: Optional[str] = None) -> List[Union[MealBaseMenuModel, FoodBaseMenuModel]]:
        """Retrieves the full structural timeline of menus generated for a user, optionally filtered by target."""
        key_condition = Key(self.pk_key).eq(f"USER#{cognito_sub}") & Key(self.sk_key).begins_with("MENU#")

        if target_person:
            response = self.table.query(
                KeyConditionExpression=key_condition,
                FilterExpression=Attr("target_person").eq(target_person)
            )
        else:
            response = self.table.query(KeyConditionExpression=key_condition)

        items = response.get("Items", [])
        items.sort(key=lambda x: x.get("created_at", 0), reverse=True)

        return [parsed for item in items if (parsed := self._deserialize_item(item)) is not None]

    def activate_menu_for_target_person(self, cognito_sub: str, menu_id: UUID, target_person: str) -> bool:
        """
        Activates a specific menu and automagically deactivates ALL past active menus
        for that specific target person to maintain state consistency.
        """
        user_pk = f"USER#{cognito_sub}"
        target_sk = f"MENU#{menu_id}"

        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(user_pk) & Key(self.sk_key).begins_with("MENU#"),
            FilterExpression=Attr("target_person").eq(target_person) & Attr("status").eq(MenuStatus.ACTIVE.value)
        )
        active_items = response.get("Items", [])

        now_ms = current_millis()
        for item in active_items:
            old_sk = item.get(self.sk_key)
            if old_sk == target_sk:
                continue

            self.table.update_item(
                Key={self.pk_key: user_pk, self.sk_key: old_sk},
                UpdateExpression="SET #st = :inactive, updated_at = :now",
                ExpressionAttributeNames={"#st": "status"},
                ExpressionAttributeValues={
                    ":inactive": MenuStatus.ARCHIVED.value,
                    ":now": now_ms
                }
            )

        self.table.update_item(
            Key={self.pk_key: user_pk, self.sk_key: target_sk},
            UpdateExpression="SET #st = :active, updated_at = :now",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={
                ":active": MenuStatus.ACTIVE.value,
                ":now": now_ms
            }
        )
        return True

    def _deserialize_item(self, item: Optional[dict]) -> Optional[Union[MealBaseMenuModel, FoodBaseMenuModel]]:
        """Maps internal DynamoDB structural fields back to the precise, strongly-typed Pydantic model."""
        if not item:
            return None

        item["pk"] = item.pop(self.pk_key, None)
        item["sk"] = item.pop(self.sk_key, None)

        menu_type_value = item.get("menu_type")

        if menu_type_value == MenuType.MEALS.value:
            return MealBaseMenuModel.model_validate(item)
        elif menu_type_value == MenuType.FOOD_ITEMS.value:
            return FoodBaseMenuModel.model_validate(item)

        raise ValueError(f"Unsupported menu type mapping encountered in database payload: '{menu_type_value}'")