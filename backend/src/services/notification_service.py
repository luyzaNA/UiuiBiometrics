from uuid import uuid4
from src.models.notification.notification_model import NotificationModel
from src.repositories.notification_repository import NotificationRepository
from src.utils.enums import NotificationType, NOTIFICATION_TEMPLATES
from src.utils.time import current_millis

class NotificationService:
    """
    Notification Service

    Handles business logic for managing application notifications
    """

    def __init__(self):
        """Initializes the service with its underlying repository dependency."""
        self.repo = NotificationRepository()

    def create_notification(self, cognito_sub: str, notif_type: NotificationType, metadata: dict | None = None) -> NotificationModel:
        """
        Generates and saves a new notification item based on a predefined template configuration.
        Dynamically handles partition key prefixes depending on the target role (e.g., USER or DOCTOR).
        """
        now = current_millis()

        template = NOTIFICATION_TEMPLATES.get(notif_type, {})

        role = template.get("role", "USER").upper()

        notification = NotificationModel(
            pk=f"{role}#{cognito_sub}",
            sk=f"NOTIFICATION#{now}#{uuid4()}",
            cognito_sub=cognito_sub,
            notification_type=notif_type,
            title=template.get("title", "Notification"),
            message=template.get("message", "You have a new notification."),
            created_at=now,
            metadata=metadata or {}
        )

        return self.repo.create(notification)

    def get_all(self, user_pk: str):
        """Retrieves all unread notifications for a specified target partition key."""
        return self.repo.get_all(user_pk)

    def mark_read(self, user_pk: str, sk: str):
        """Marks a single specific notification item as read using its keys."""
        self.repo.mark_read(user_pk, sk)

    def mark_all_read(self, user_pk: str):
        """Batch updates all unread notifications to read status for the designated partition key."""
        self.repo.mark_all_read(user_pk)

    def get_unread_count(self, user_pk: str) -> int:
        """Counts the total number of pending unread notifications within a partition."""
        return self.repo.count_unread(user_pk)