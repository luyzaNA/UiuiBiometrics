from typing import Optional
from pydantic import Field
from src.models.profile.profile_model import ProfileModel

class DoctorProfileModel(ProfileModel):
    """
    Represents the public profile of a specialist doctor.
    Inherits base attributes (age, gender, avatar, etc.) from ProfileModel.
    """

    pk: str = Field(
        description="Primary partition key. Format: DOCTOR#<cognito_sub>."
    )

    bio: Optional[str] = Field(
        default=None,
        description="Professional bio and experience."
    )

    price: int = Field(
        default=0,
        description="Consultation price."
    )
 
    average_rating: float = Field(
        default=5.0,
        description="Calculated average rating from patient reviews."
    )

    total_reviews: int = Field(
        default=0,
        description="Total number of reviews received."
    )

    gsi2_pk: str = Field(
        default="SYSTEM#DOCTORS",
        description="GSI2 PK used to fetch all approved doctors."
    )
    gsi2_sk: str = Field(
        default="PROFILE#METADATA",
        description="GSI2 SK static to match the profile base record."
    )