from boto3.dynamodb.conditions import Key, Attr
from src.models.notification.notification_model import NotificationModel
from src.repositories.base_repository import BaseRepository
from src.utils.enums import NotificationType
from src.utils.settings import UIUI_BIOMETRICS_TABLE

class NotificationRepository(BaseRepository):
    """Repository for managing application notifications within DynamoDB."""

    def __init__(self) -> None:
        """
        Initialize the repository and verify the table environment configuration.
        """
        table_name: str | None = UIUI_BIOMETRICS_TABLE

        if not table_name:
            raise ValueError("UIUI_BIOMETRICS_TABLE environment variable is not set")

        self._table_name = table_name
        super().__init__()

    def create(self, notification: NotificationModel) -> NotificationModel:
        """
        Save a new notification item into DynamoDB.
        """
        self.table.put_item(
            Item={
                self.pk_key: notification.pk,
                self.sk_key: notification.sk,
                "notification_id": str(notification.notification_id),
                "cognito_sub": notification.cognito_sub,
                "type": notification.notification_type.value,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "created_at": notification.created_at,
                "metadata": notification.metadata
            }
        )
        return notification

    def get_all(self, user_pk: str) -> list[NotificationModel]:
        """
        Fetch all unread notifications belonging to a specific user partition.
        """
        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(user_pk),
            FilterExpression=Attr("is_read").eq(False)
        )
        items = response.get("Items", [])

        return [self.convert_to_model(i) for i in items if i.get(self.sk_key, "").startswith("NOTIFICATION#")]

    def mark_read(self, user_pk: str, sk: str):
        """
        Mark a single specific notification as read.
        Uses a ConditionExpression to guarantee the record exists prior to updating.
        """
        self.table.update_item(
            Key={
                self.pk_key: user_pk,
                self.sk_key: sk
            },
            UpdateExpression="SET is_read = :val",
            ExpressionAttributeValues={":val": True},
            ConditionExpression="attribute_exists(#pk_name)",
            ExpressionAttributeNames={"#pk_name": self.pk_key}
        )

    def mark_all_read(self, user_pk: str):
        """
        Query and batch-update all currently unread notifications to read status for a user.
        """
        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(user_pk),
            FilterExpression=Attr("is_read").eq(False)
        )
        items = response.get("Items", [])

        for item in items:
            self.mark_read(user_pk, item[self.sk_key])

    def count_unread(self, user_pk: str) -> int:
        """
        Return the total count of unread notifications for a user without pulling full items payload.
        """
        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(user_pk),
            FilterExpression=Attr("is_read").eq(False)
        )
        return response.get("Count", 0)

    def convert_to_model(self, item: dict) -> NotificationModel:
        """
        Convert a DynamoDB item attributes dictionary into a structured NotificationModel instance.
        """
        return NotificationModel(
            pk=item[self.pk_key],
            sk=item[self.sk_key],
            notification_id=item["notification_id"],
            cognito_sub=item["cognito_sub"],
            notification_type=NotificationType(item["type"]),
            title=item.get("title", ""),
            message=item.get("message", ""),
            is_read=item.get("is_read", False),
            created_at=int(item.get("created_at", 0)),
            metadata=item.get("metadata", {})
        )