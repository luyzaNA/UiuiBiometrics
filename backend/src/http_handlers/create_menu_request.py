from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from src.models.menu.food_base_menu import DeficiencyTargetDef

class DeficiencyScore(BaseModel):
    name: str
    score: float

class CreateMenuRequest(BaseModel):
    """
    Payload received from the frontend to generate or create a new menu.
    """
    assessment_id: UUID = Field(description="The source assessment this menu fixes.")
    deficiencies: List[DeficiencyScore] = Field(
        default_factory=list,
        description="List of identified deficiencies to fix."
    )
    language: Optional[str] = Field(default="en")

    meal_category: Optional[str] = Field(
        default=None,
        description="Specific category to generate: breakfasts, lunches, dinners, or snacks."
    )
    full_menu_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="The stitched menu data sent from frontend for final database saving."
    )

class ActivateMenuRequest(BaseModel):
    """Validates the incoming payload to activate a menu."""
    menu_id: UUID = Field(..., description="The unique identifier of the menu to activate.")