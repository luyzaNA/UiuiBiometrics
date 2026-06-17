"""Assessment model definition and schema."""

from typing import Optional, Dict, List
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

from src.models.fields import label_field, timestamp_field, target_person_field, age_field
from src.utils.enums import Gender, AssessmentStatus


class DoctorDetails(BaseModel):
    """
    Represents the detailed information of the doctor assigned to the assessment.
    Captured at the moment of assignment to keep a historical snapshot.
    """
    doctor_id: str = Field(
        description="The unique Cognito sub or identifier of the doctor."
    )
    full_name: str = Field(
        description="Doctor's full name."
    )

    bio: Optional[str] = Field(
        default=None,
        description="A short biography or professional description of the doctor."
    )
    avatar_url: Optional[str] = Field(
        default=None,
        description="The profile picture/avatar URL of the doctor."
    )
    avatar_key: Optional[str] = Field(
        default=None,
        description="The presigned avatar URL of the doctor."
    )


class AssessmentModel(BaseModel):
    """
    Represents a single health assessment session.

    This entity captures the symptoms provided by the user, runs them through
    the ML pipeline alongside age and gender, and stores the predicted micro-nutrient
    deficiencies. It also handles red-flag triggers, payment routing, and doctor reviews.
    """

    pk: str = Field(
        description=(
            "Primary partition key. Format: USER#<cognito_sub>. "
            "Identifies the user partition this assessment belongs to."
        )
    )
    sk: str = Field(
        description=(
            "Primary sort key. Format: ASSESS#<assessment_id>. "
            "Allows chronological sorting and unique identification of sessions."
        )
    )

    gsi2_pk: Optional[str] = Field(
        default=None,
        description="GSI2 partition key. Format: DOCTOR#<doctor_id>. Used by doctors to query their queue."
    )
    gsi2_sk: Optional[str] = Field(
        default=None,
        description="GSI2 sort key. Format: STATUS#<status>#<created_at> for advanced filtering."
    )
    cognito_sub: str = Field(
        description="The 'sub' claim from the Cognito JWT, identifying the user."
    )
    assessment_id: UUID = Field(
        default_factory=uuid4,
        description="The internal unique identifier for this specific assessment session."
    )

    target_person: str = target_person_field(
        default="Principal",
    )

    age: int = age_field()

    gender: Gender = Field(
        description="The gender used during this specific quiz session, mapped to numerical values in the ML pipeline."
    )

    symptoms: Dict[str, float] = Field(
        default_factory=dict,
        description=(
            "A map of active symptoms and their intensities (0.3, 0.6, 1.0). "
            "To save DB space, symptoms with 0.0 intensity are omitted and filled by the backend."
        )
    )

    wellness_score: float = Field(
        default=100.0,
        description="Overall health score calculated as 100 - sum(intensity * weight). Lower means higher risk."
    )

    predicted_deficiencies: Dict[str, float] = Field(
        default_factory=dict,
        description="A map of micro-nutrients (vitamins/minerals) and their predicted deficiency probabilities."
    )

    status: AssessmentStatus = Field(
        default=AssessmentStatus.PENDING,
        description="The current operational state of the assessment workflow."
    )

    has_red_flags: bool = Field(
        default=False,
        description="Flag indicating if dangerous symptom combinations triggered an immediate medical alert."
    )

    red_flag_details: List[str] = Field(
        default_factory=list,
        description="List of specific critical symptom pairs or triggers that caused the red flag alert."
    )

    next_review_days: Optional[int] = Field(
        default=None,
        description="Days until the user should retake the quiz. Set only if target_person is 'Principal'."
    )

    doctor_details: Optional[DoctorDetails] = Field(
        default=None,
        description="The structured details of the doctor assigned to review this case."
    )

    doctor_notes: Optional[str] = Field(
        default=None,
        description="The final textual feedback or consultation notes provided by the doctor."
    )

    payment_reference: Optional[str] = Field(
        default=None,
        description="The reference ID from the payment processor (e.g., Stripe charge or payment intent ID)."
    )

    image_keys: List[str] = Field(
        default_factory=list,
        description="List of S3 keys for the uploaded assessment images."
    )

    image_urls: List[str] = Field(
        default_factory=list,
        description="List of presigned URLs for the uploaded assessment images."
    )

    parent_assessment_id: Optional[UUID] = Field(
        default=None,
        description="The id of old assessment."
    )

    created_at: int = timestamp_field(
        description="Unix timestamp when the assessment session was completed."
    )
    updated_at: int = timestamp_field(
        description="Unix timestamp of the last update (e.g., when the doctor added notes)."
    )