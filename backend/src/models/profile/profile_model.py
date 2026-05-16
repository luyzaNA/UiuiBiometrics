"""Profile model definition and schema."""

from uuid import UUID, uuid4
from pydantic import BaseModel, Field

from src.models.fields import label_field, timestamp_field
from src.utils.enums import Gender


class ProfileModel(BaseModel):
    """
    Represents the core user profile.

    """

    pk: str = Field(
        description=(
            "Primary partition key. Format: USER#<profile_id>. "
            "Used as the unique identifier for the user across the system."
        )
    )
    sk: str = Field(
        description=(
            "Primary sort key. Format: PROFILE#METADATA. "
            "Fixed string to identify the base profile record within the user partition."
        )
    )

    gsi1_pk: str = Field(
        description=(
            "GSI1 partition key. Format: COGNITO#<sub>. "
            "Used to look up the profile_id immediately after AWS authentication."
        )
    )
    gsi1_sk: str = Field(
        default="PROFILE",
        description="GSI1 sort key. Fixed value for profile indexing."
    )

    profile_id: UUID = Field(
        default_factory=uuid4,
        description="The internal unique identifier generated automatically for the user."
    )

    cognito_sub: str = label_field(
        description="The 'sub' (Subject) claim from the Cognito JWT, linking Auth to Data."
    )

    age: int = Field(
        ge=0,
        le=120,
        description="User's age, required for the Random Forest model's feature vector."
    )

    gender: Gender = Field(
        description=(
            "User's gender. Required for the Random Forest model's feature vector. "
        )
    )

    created_at: int = timestamp_field(
        description="Unix timestamp when the profile was created."
    )
    updated_at: int = timestamp_field(
        description="Unix timestamp of the last profile update (e.g., age change)."
    )