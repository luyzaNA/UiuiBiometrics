from typing import Optional
from pydantic import BaseModel, Field
from src.utils.enums import Gender

class CreateDoctorProfileRequest(BaseModel):
    age: int = Field(..., ge=0, le=120)
    gender: Gender = Field(...)
    bio: Optional[str] = Field(default=None)
    avatar: Optional[str] = Field(default=None)
    price: int = Field(default=0, ge=0)
    name: str = Field(default="", description="Doctor's full name")

class UpdateDoctorProfileRequest(BaseModel):
    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[Gender] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    avatar: Optional[str] = Field(default=None)
    price: Optional[int] = Field(default=None, ge=0)
    name: Optional[str] = Field(default=None, description="Doctor's full name")