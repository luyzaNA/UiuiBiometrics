"""Profile model definition and schema."""
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

from src.models.fields import label_field, timestamp_field, age_field
from src.utils.enums import Gender


class ProfileModel(BaseModel):
    """
    Represents the core user profile.

    """

    pk: str = Field(
        description=(
            "Primary partition key. Format: USER#<cognito_sub>. "
            "Uses the AWS Cognito unique identity (sub) directly to locate the user's partition."
        )
    )
    sk: str = Field(
        default="PROFILE#METADATA",
        description=(
            "Primary sort key. Format: PROFILE#METADATA. "
            "Fixed string to identify the base profile record within the user partition."
        )
    )

    profile_id: UUID = Field(
        default_factory=uuid4,
        description="The internal unique identifier generated automatically for business logic references."
    )

    cognito_sub: str = label_field(
        description="The 'sub' (Subject) claim from the Cognito JWT, matching the raw ID inside the PK."
    )

    full_name: str = Field(
        default="",
        description="User's full name."
    )

    age: int = age_field()

    gender: Gender = Field(
        description=(
            "User's gender. Required for the Random Forest model's feature vector. "
        )
    )
    avatar_url: Optional[str]= Field(
        default="",
        description=(
            "URL to the user's avatar image."
        )
    )

    avatar_key: Optional[str] = Field(
        default=None,
        description=(
            "The S3 key for the user's avatar image."
        )
    )

    created_at: int = timestamp_field(
        description="Unix timestamp when the profile was created."
    )
    updated_at: int = timestamp_field(
        description="Unix timestamp of the last profile update (e.g., age change)."
    )