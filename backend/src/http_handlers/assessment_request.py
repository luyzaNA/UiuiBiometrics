"""Assessment request validation schemas."""
from typing import Dict, Optional, List
from pydantic import BaseModel, Field

from src.models.fields import age_field
from src.utils.enums import Gender

class CreateAssessmentRequest(BaseModel):
    """Payload received for creating a new symptom analysis."""

    target_person: str = Field(
        default="Principal",
        description="Name or label of the person being assessed (e.g., 'Principal', 'Mother')."
    )
    age: int = age_field()

    gender: Gender = Field(
        description="Subject's gender, used as a feature in the ML model."
    )
    symptoms: Dict[str, float] = Field(
        min_length=1,
        description="Dictionary of active symptoms and their intensities (e.g., {'Fatigue': 0.6})."
    )
    images: Optional[List[str]] = Field(
        default_factory=list,
        description="List of base64 encoded images."
    )