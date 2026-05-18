"""Profile repository."""

from uuid import UUID
from boto3.dynamodb.conditions import Key

from src.http_handlers.exceptions import NotFoundException
from src.models.profile.profile_model import ProfileModel
from src.repositories.base_repository import BaseRepository
from src.utils.enums import Gender

from src.utils.settings import UIUI_BIOMETRICS_TABLE

from src.models.profile.update_profile_model import ProfileUpdateModel


class ProfileRepository(BaseRepository):
    """Profile repository for managing user demographics and Cognito links."""

    def __init__(self) -> None:
        table_name: str | None = UIUI_BIOMETRICS_TABLE

        if not table_name:
            raise ValueError("UIUI_BIOMETRICS_TABLE environment variable is not set")

        self._table_name = table_name

        self.index_1: str = "GSI1"
        self.gsi1_pk_key: str = "GSI1_PK"
        self.gsi1_sk_key: str = "GSI1_SK"

        super().__init__()

    def create_profile(self, profile: ProfileModel) -> ProfileModel:
        """
        Create a new user profile.
        """
        self.table.put_item(
            Item={
                self.pk_key: profile.pk,
                self.sk_key: profile.sk,
                self.gsi1_pk_key: profile.gsi1_pk,
                self.gsi1_sk_key: profile.gsi1_sk,
                "profile_id": str(profile.profile_id),
                "cognito_sub": profile.cognito_sub,
                "age": profile.age,
                "gender": profile.gender.value,
                "avatar_url": profile.avatar_url,
                "avatar_key": profile.avatar_key,
                "created_at": profile.created_at,
                "updated_at": profile.updated_at,
            }
        )
        return profile

    def get_by_id(self, profile_id: UUID) -> ProfileModel:
        """
        Get a profile by the internal profile_id (the PK).
        """
        pk = f"USER#{profile_id}"
        sk = "PROFILE#METADATA"

        response = self.table.get_item(
            Key={self.pk_key: pk, self.sk_key: sk}
        )

        item = response.get("Item")
        if not item:
            raise NotFoundException(f"Profile with ID {profile_id} not found")

        return self.convert_to_profile_model(item)

    def get_by_cognito_sub(self, sub: str) -> ProfileModel:
        """
        Lookup a profile using the AWS Cognito 'sub' via GSI1.
        This is used when a user logs in via Google/Email.
        """
        gsi1_pk = f"COGNITO#{sub}"

        response = self.table.query(
            IndexName=self.index_1,
            KeyConditionExpression=Key(self.gsi1_pk_key).eq(gsi1_pk)
        )

        items = response.get("Items", [])
        if not items:
            raise NotFoundException("No profile found for this Cognito identity")

        return self.convert_to_profile_model(items[0])

    def convert_to_profile_model(self, item: dict) -> ProfileModel:
        """Convert DynamoDB dictionary to ProfileModel Pydantic object."""
        return ProfileModel(
            pk=item.get(self.pk_key),
            sk=item.get(self.sk_key),
            gsi1_pk=item.get(self.gsi1_pk_key),
            gsi1_sk=item.get(self.gsi1_sk_key),
            profile_id=UUID(item.get("profile_id")),
            cognito_sub=item.get("cognito_sub"),
            age=int(item.get("age")),
            gender=Gender(item.get("gender")),
            avatar_url=item.get("avatar_url", ""),
            avatar_key=item.get("avatar_key"),
            created_at=int(item.get("created_at", 0)),
            updated_at=int(item.get("updated_at", 0)),
        )

    def update(self, profile_update: ProfileUpdateModel) -> ProfileModel:
        """Update an existing profile using a partial update expression."""

        update_parts = ["updated_at = :updated_at"]
        if profile_update.age is not None:
            update_parts.append("age = :age")
        if profile_update.gender is not None:
            update_parts.append("gender = :gender")
        if profile_update.avatar_key is not None:
            update_parts.append("avatar_key = :avatar_key")

        response = self.table.update_item(
            Key={
                self.pk_key: profile_update.pk,
                self.sk_key: profile_update.sk,
            },
            UpdateExpression=f"SET {', '.join(update_parts)}",
            ExpressionAttributeValues=profile_update.to_expression_values(),
            ConditionExpression="attribute_exists(PK)",
            ReturnValues="ALL_NEW",
        )

        updated_item = response.get("Attributes")
        if not updated_item:
            raise NotFoundException("Profile not found for update")

        return self.convert_to_profile_model(updated_item)