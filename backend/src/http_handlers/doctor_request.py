from typing import Optional
from pydantic import BaseModel, Field
from src.utils.enums import Gender

class CreateDoctorProfileRequest(BaseModel):
    age: int = Field(..., ge=0, le=120)
    gender: Gender = Field(...)
    bio: Optional[str] = Field(default=None)
    avatar: Optional[str] = Field(default=None)
    fullName: str = Field(default="", description="Doctor's full name")

class UpdateDoctorProfileRequest(BaseModel):
    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[Gender] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    avatar: Optional[str] = Field(default=None)
    fullName: Optional[str] = Field(default=None, description="Doctor's full name")

class CreateDoctorReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(default=None, description="Optional text review")