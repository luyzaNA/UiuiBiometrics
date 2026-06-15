from uuid import UUID, uuid4
from pydantic import BaseModel, Field

from src.models.fields import timestamp_field
from src.utils.enums import NotificationType


class NotificationModel(BaseModel):
    """
    Represents a system or application notification sent to a user.
    """

    pk: str = Field(
        description=(
            "Primary partition key. Format: USER#<cognito_sub>. "
            "Groups the notification within the specific recipient's partition."
        )
    )
    sk: str = Field(
        description=(
            "Primary sort key. Format: NOTIFICATION#<notification_id>. "
            "Uniquely identifies the specific notification record within the user's partition."
        )
    )

    cognito_sub: str = Field(
        description="The 'sub' (Subject) claim from the Cognito JWT, identifying the notification recipient."
    )

    notification_id: UUID = Field(
        default_factory=uuid4,
        description="The internal unique identifier generated automatically for this notification."
    )

    notification_type: NotificationType = Field(
        description="The type of the notification, used to determine frontend routing and behavior logic."
    )

    title: str = Field(
        description="The title of the notification, typically mapping to a localization key on the frontend."
    )
    message: str = Field(
        description="The localized body text or translation key containing the detailed notification message."
    )

    is_read: bool = Field(
        default=False,
        description="Flag indicating whether the user has read or acknowledged the notification."
    )

    created_at: int = timestamp_field(
        description="Unix timestamp indicating when the notification was generated."
    )

    metadata: dict = Field(
        default_factory=dict,
        description=(
            "Dynamic key-value pairs (e.g., assessmentId, doctorId) required by the frontend "
            "to perform deep-linking or context-specific actions."
        )
    )