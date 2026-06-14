from typing import Optional
from pydantic import BaseModel, Field
from src.utils.time import current_millis

class ReviewModel(BaseModel):
    reviewer_sub: str = Field(description="Cognito sub-ul pacientului care a lăsat review-ul")
    reviewer_name: str = Field(description="Numele pacientului")
    rating: int = Field(ge=1, le=5, description="Nota acordată (1-5)")
    comment: Optional[str] = Field(default=None, description="Comentariul scris de pacient")
    created_at: int = Field(default_factory=current_millis, description="Timestamp-ul review-ului")