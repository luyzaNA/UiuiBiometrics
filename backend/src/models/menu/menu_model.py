from typing import List, Optional, Literal
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

from src.models.fields import timestamp_field
from src.utils.enums import MenuStatus, MenuType

class LocalizedText(BaseModel):
    """Represents text available in both English and Romanian."""
    en: str = Field(
        description="The English version of the text."
    )
    ro: str = Field(
        description="The Romanian version of the text."
    )

class MenuBaseModel(BaseModel):
    """
    Represents the core configuration and metadata shared across all nutritional menus.
    """
    pk: str = Field(
        description="Primary partition key. Format: USER#<cognito_sub>. Identifies the user partition this menu belongs to."
    )
    sk: str = Field(
        description="Primary sort key. Format: MENU#<menu_id>. Uniquely identifies the specific menu session within the user partition."
    )

    gsi2_pk: Optional[str] = Field(
        default=None,
        description="GSI2 partition key. Format: DOCTOR#<doctor_id>. Used by doctors to query their review queue."
    )
    gsi2_sk: Optional[str] = Field(
        default=None,
        description="GSI2 sort key. Format: STATUS#<status>#<created_at> for lifecycle sorting and medical filtering."
    )

    gsi3_pk: Optional[str] = Field(
        default=None,
        description="GSI3 partition key. Format: MENU#ACTIVE. Used to group active menus awaiting deadline tracking."
    )
    gsi3_sk: Optional[str] = Field(
        default=None,
        description="GSI3 sort key. Format: <review_deadline>. Allows efficient range queries to find expired menus."
    )

    target_person: str = Field(
        description="Person for whom the menu is generated."
    )

    menu_id: UUID = Field(
        default_factory=uuid4,
        description="The internal unique identifier generated automatically for business logic references."
    )
    assessment_id: UUID = Field(
        description="The unique identifier of the source health assessment this menu is based upon."
    )
    cognito_sub: str = Field(
        description="The 'sub' (Subject) claim from the Cognito JWT, matching the raw ID inside the PK."
    )
    menu_type: MenuType = Field(
        description="The strategic type of the menu (FOOD_ITEMS, MEALS, MACROS)."
    )
    status: MenuStatus = Field(
        default=MenuStatus.DRAFT,
        description="The current operational state of the menu workflow, determining frontend execution controls."
    )
    review_after_days: int = Field(
        description="The calculated number of days the user must follow the menu before triggering a new assessment review."
    )
    review_deadline: int = Field(
        description="The exact Unix timestamp (in milliseconds) when the menu review period expires and a retake quiz is required."
    )

    doctor_id: Optional[str] = Field(
        default=None,
        description="The unique identifier (Cognito sub/ID) of the doctor assigned to review this specific menu."
    )
    doctor_modifications: Optional[str] = Field(
        default=None,
        description="The textual feedback, adjustments, or specific clinical notes injected by the reviewing doctor."
    )
    payment_reference: Optional[str] = Field(
        default=None,
        description="The reference ID from the payment processor confirming transaction for the doctor review."
    )

    created_at: int = timestamp_field(
        description="Unix timestamp when the menu session was initially generated."
    )
    updated_at: int = timestamp_field(
        description="Unix timestamp of the last menu configuration update or medical status shift."
    )