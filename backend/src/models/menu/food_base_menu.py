"""Food-based Recommendation model definition and schema."""

from typing import List
from pydantic import BaseModel, Field

from src.models.menu.meal_base_menu import LocalizedText
from src.models.menu.menu_model import MenuBaseModel
from src.utils.enums import MenuType


class FoodPortionDef(BaseModel):
    """Defines a single food recommendation tailored with practical serving sizes and frequency rules."""
    food_name: LocalizedText = Field(
        description="The localized name of the recommended food item."
    )
    serving_size: str = Field(
        description="Realistic serving size (e.g., '150g', '2 medium eggs')."
    )
    frequency: LocalizedText = Field(
        description="Localized target frequency for consuming this food."
    )
    absorption_boosters: List[LocalizedText] = Field(
        default_factory=list,
        description="Synergistic foods required to optimize bioavailability."
    )

class DeficiencyTargetDef(BaseModel):
    """Groups a specific identified deficiency with its mapped targeted food remedies."""
    deficiency_name: LocalizedText = Field(
        description="The localized name of the micronutrient deficiency."
    )
    recommended_foods: List[FoodPortionDef] = Field(
        min_length=1,
        description="The precise collection of foods selected to correct this specific deficiency."
    )

class FoodBaseMenuModel(MenuBaseModel):
    """Represents a food-item prescription structured directly around fixing identified micronutrient deficiencies."""

    menu_type: MenuType = Field(
        default=MenuType.FOOD_ITEMS,
        description="Strict discriminator for Food Item menus."
    )

    deficiency_targets: List[DeficiencyTargetDef] = Field(
        default_factory=list,
        description="The core payload containing the list of deficiencies and their specific food-based treatments."
    )

FoodPortionDef.model_rebuild()
DeficiencyTargetDef.model_rebuild()
FoodBaseMenuModel.model_rebuild()