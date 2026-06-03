from typing import List
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from src.models.menu.menu_model import MenuBaseModel, LocalizedText
from src.utils.enums import MenuType


class MealOptionDef(BaseModel):
    """A meal option from the recipe bank."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    meal_id: str = Field(
        description="Internal ID for reference (e.g., B1, L2)"
    )
    name: LocalizedText = Field(
        description="Name of the dish"
    )
    description: LocalizedText = Field(
        description="Brief description of how it addresses deficiencies"
    )
    prep_time_minutes: int = Field(
        description="Estimated preparation time"
    )
    key_ingredients: List[LocalizedText] = Field(
        description="Key ingredients that target the deficiencies"
    )
    instructions: LocalizedText = Field(
        description="Short assembly/cooking instructions"
    )


class ExampleDayDef(BaseModel):
    """An example of a perfect combination of meals from the bank."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    rationale: LocalizedText = Field(
        description="Why this combination works perfectly"
    )
    breakfast_ref: str = Field(
        description="Reference to meal_id from breakfasts"
    )
    lunch_ref: str = Field(
        description="Reference to meal_id from lunches"
    )
    dinner_ref: str = Field(
        description="Reference to meal_id from dinners"
    )
    snack_ref: str = Field(
        description="Reference to meal_id from snacks"
    )


class MealBaseMenuModel(MenuBaseModel):
    """The complete model for the Flexible Meal Bank."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    menu_type: MenuType = Field(
        default=MenuType.MEALS,
        description="Strict discriminator for Meal Bank menus."
    )

    breakfasts: List[MealOptionDef] = Field(
        default_factory=list,
        description="The curated list of breakfast options tailored to the user's deficiencies."
    )
    lunches: List[MealOptionDef] = Field(
        default_factory=list,
        description="The curated list of lunch options tailored to the user's deficiencies."
    )
    dinners: List[MealOptionDef] = Field(
        default_factory=list,
        description="The curated list of dinner options tailored to the user's deficiencies."
    )
    snacks: List[MealOptionDef] = Field(
        default_factory=list,
        description="The curated list of snack options tailored to the user's deficiencies."
    )
    deficiencies: List[str] = Field(
        default_factory=list,
        description="List of nutrient deficiencies targeted by this meal bank."
    )



MealOptionDef.model_rebuild()
ExampleDayDef.model_rebuild()
MealBaseMenuModel.model_rebuild()