"""Profile requests."""

from typing import Optional
from pydantic import BaseModel, Field

from src.utils.enums import Gender


class CreateProfileRequest(BaseModel):
    """
    Create profile request.

    This is used during the onboarding quiz after a user first authenticates
    with Cognito. Age and Gender are mandatory for the ML algorithm.
    """

    age: int = Field(
        ...,
        ge=0,
        le=120,
        description="The age of the user, used for nutrient deficiency prediction."
    )
    gender: Gender = Field(
        ...,
        description="The gender of the user (feminine or masculine)."
    )
    avatar: Optional[str] = Field(
        None,
        description="Optional URL for the user's avatar image."
    )

    full_name: str = Field(
        ...,
        description="User's full name"
    )


class UpdateProfileRequest(BaseModel):
    """
    Update profile request.

    Allows users to update their demographics. All fields are optional
    to support partial updates.
    """

    age: Optional[int] = Field(
        None,
        ge=0,
        le=120,
        description="Updated age of the user."
    )
    gender: Optional[Gender] = Field(
        None,
        description="Updated gender of the user."
    )
    avatar: Optional[str] = Field(
        None,
        description="Updated URL for the user's avatar image."
    )
    full_name: Optional[str] = Field(
        None,
        description="User's full name"
    )
