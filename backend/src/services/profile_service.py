"""Profile Service"""
import base64
import os
import uuid
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError

from src.http_handlers.profile_requests import CreateProfileRequest, UpdateProfileRequest
from src.models.profile.profile_model import ProfileModel
from src.repositories.profile_repository import ProfileRepository
from src.utils.settings import AVATAR_BUCKET
from src.utils.time import current_millis
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


def upload_avatar_if_exists(avatar: str | None, cognito_sub: str) -> str | None:
    if not avatar or not avatar.startswith("data:image"):
        return None

    if not AVATAR_BUCKET:
        logger.error("[UPLOAD_AVATAR] AVATAR_BUCKET environment variable is not set.")
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
        logger.exception(f"Error uploading avatar to S3: {e}")
        return None


def get_signed_url_from_s3(key: str | None) -> str | None:
    """
    Generate a resigned URL for downloading a file from S3

    Arguments:
        key: Optional S3 key

    Returns:
        The resigned URL or None
    """
    if not key:
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


class ProfileService:
    """
    Profile Service

    Handles business logic for user profiles, including linking Cognito
    identities and preparing demographic data for the ML model.
    """

    def __init__(self):
        self.profile_repository = ProfileRepository()

    def create_profile(self, request: CreateProfileRequest, cognito_sub: str) -> ProfileModel:
        """Creates a new profile directly using the Cognito sub as PK."""
        current_date: int = current_millis()
        avatar_key = upload_avatar_if_exists(request.avatar, cognito_sub)

        avatar_url = get_signed_url_from_s3(avatar_key) if avatar_key else None

        new_profile = ProfileModel(
            pk=f"USER#{cognito_sub}",
            sk="PROFILE#METADATA",
            profile_id=uuid4(),
            cognito_sub=cognito_sub,
            age=request.age,
            gender=request.gender,
            full_name=request.full_name,
            avatar_url=avatar_url,
            avatar_key=avatar_key,
            created_at=current_date,
            updated_at=current_date
        )

        return self.profile_repository.create_profile(new_profile)

    def get_profile_by_sub(self, cognito_sub: str) -> ProfileModel:
        """Retrieve a profile based on the Cognito Sub and dynamically inject the avatar URL."""
        profile = self.profile_repository.get_by_cognito_sub(sub=cognito_sub)

        if profile.avatar_key:
            profile.avatar_url = get_signed_url_from_s3(profile.avatar_key)

        return profile

    def update_profile(self, request: UpdateProfileRequest, cognito_sub: str) -> ProfileModel:
        """Handles business logic for updating a user profile using the Cognito sub."""
        current_date: int = current_millis()
        avatar_key = upload_avatar_if_exists(request.avatar, cognito_sub)

        avatar_url = get_signed_url_from_s3(avatar_key) if avatar_key else None

        update_model = ProfileUpdateModel(
            pk=f"USER#{cognito_sub}",
            age=request.age,
            gender=request.gender,
            full_name=request.full_name,
            updated_at=current_date,
            avatar_key=avatar_key,
            avatar_url=avatar_url
        )

        profile = self.profile_repository.update(update_model)

        if profile.avatar_key and not profile.avatar_url:
            profile.avatar_url = get_signed_url_from_s3(profile.avatar_key)

        return profile