"""Food menu HTTP requests definitions."""

from typing import List
from uuid import UUID
from pydantic import BaseModel, Field

from src.models.menu.food_based_menu import DeficiencyTargetDef


class CreateFoodMenuRequest(BaseModel):
    """
    Payload received from the AI engine or frontend to create a new protocol.
    """
    assessment_id: UUID = Field(description="The source assessment this menu fixes.")
    review_after_days: int = Field(default=30, description="Recommended duration.")
    deficiency_targets: List[DeficiencyTargetDef] = Field(
        description="The AI-generated list of targets and food recommendations."
    )

class ActivateMenuRequest(BaseModel):
    """Validates the incoming payload to activate a menu."""
    menu_id: UUID = Field(..., description="The unique identifier of the menu to activate.")