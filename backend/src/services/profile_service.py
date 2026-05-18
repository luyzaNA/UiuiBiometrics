"""Profile Service"""
import base64
import os
import uuid
from uuid import UUID, uuid4

import boto3
from botocore.exceptions import ClientError

from src.http_handlers.profile_requests import CreateProfileRequest

from src.models.profile.profile_model import ProfileModel
from src.repositories.profile_repository import ProfileRepository
from src.utils.settings import AVATAR_BUCKET
from src.utils.time import current_millis

from src.http_handlers.profile_requests import UpdateProfileRequest
from src.models.profile.update_profile_model import ProfileUpdateModel


from src.utils.logger import get_logger

logger = get_logger(__name__)
if os.environ.get("IS_OFFLINE") == "true":
    s3 = boto3.client(
        "s3",
        endpoint_url="http://localhost:4569",
        aws_access_key_id="S3RVER",
        aws_secret_access_key="S3RVER",
        region_name="eu-north-1"
    )
else:
    s3 = boto3.client("s3", region_name="eu-north-1")

class ProfileService:
    """
    Profile Service

    Handles business logic for user profiles, including linking Cognito
    identities and preparing demographic data for the ML model.
    """

    def __init__(self):
        self.profile_repository = ProfileRepository()

    def upload_avatar_if_exists(self, avatar: str | None, cognito_sub: str) -> str | None:
        if not avatar or not avatar.startswith("data:image"):
            return None
        print("LUYZAAAA")

        if not AVATAR_BUCKET:
            logger.error("[UPLOAD_AVATAR] Eroare: AVATAR_BUCKET nu este setat in environment")
            return None

        try:
            header, base64_data = avatar.split(",", 1)
            content_type = header.split(";")[0].split(":")[1]
            ext = content_type.split("/")[1]
            if ext == "jpeg":
                ext = "jpg"

            key = f"avatars/{cognito_sub}/{uuid.uuid4()}.{ext}"
            image_bytes = base64.b64decode(base64_data)

            s3.put_object(
                Bucket=AVATAR_BUCKET,
                Key=key,
                Body=image_bytes,
                ContentType=content_type
            )

            return key
        except Exception as e:
            print(e)
            return None

    def get_signed_url_from_s3(self, key: str | None) -> str | None:
        """
        Generate a presigned URL for downloading a file from S3

        Arguments:
            bucket_name: Name of the S3 bucket
            key: Optional S3 key (UUID will be generated if not provided)

        Returns:
            The presigned URL or None
        """
        if key is None:
            return None

        try:
            url: str = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": AVATAR_BUCKET, "Key": key},
                ExpiresIn=3600
            )
            return url
        except ClientError:
            logger.exception("Error generating signed URL")
            return None

    def create_profile(self, request: CreateProfileRequest, cognito_sub: str) -> ProfileModel:
        profile_id: UUID = uuid4()
        current_date: int = current_millis()

        new_profile = ProfileModel(
            pk=f"USER#{profile_id}",
            sk="PROFILE#METADATA",
            gsi1_pk=f"COGNITO#{cognito_sub}",
            gsi1_sk="PROFILE",
            profile_id=profile_id,
            cognito_sub=cognito_sub,
            age=request.age,
            gender=request.gender,
            avatar_url=None,
            avatar_key=self.upload_avatar_if_exists(request.avatar, cognito_sub),
            created_at=current_date,
            updated_at=current_date
        )

        return self.profile_repository.create_profile(new_profile)

    def get_profile_by_sub(self, cognito_sub: str) -> ProfileModel:
        """Retrieve a profile based on the Cognito Sub."""
        return self.profile_repository.get_by_cognito_sub(sub=cognito_sub)

    def get_profile_by_id(self, profile_id: UUID) -> ProfileModel:
        """Retrieve a profile by its internal UUID."""
        return self.profile_repository.get_by_id(profile_id=profile_id)

    def update_profile(self, profile_id: UUID, request: UpdateProfileRequest, cognito_sub: str) -> ProfileModel:
        """Handles business logic for updating a user profile."""
        current_date: int = current_millis()

        update_model = ProfileUpdateModel(
            pk=f"USER#{profile_id}",
            age=request.age,
            gender=request.gender,
            updated_at=current_date,
            avatar_url=None,
            avatar_key=self.upload_avatar_if_exists(request.avatar, cognito_sub),
        )

        return self.profile_repository.update(update_model)