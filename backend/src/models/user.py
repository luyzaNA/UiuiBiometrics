"""User model"""

from json import JSONDecodeError, loads
from typing import Optional, List

from pydantic import BaseModel, Field, ValidationError

from src.utils.enums import Role, RoleCategory, ALLOWED_PERMISSIONS
from src.utils.logger import get_logger

logger = get_logger(__name__)


class User(BaseModel):
    """
    User model representing the authenticated entity from Cognito.

    """

    sub: str = Field(description="The unique Cognito Subject ID.")
    email: str

    role: Role = Field(
        default=Role.USER,
        alias="custom:role"
    )
    role_category: RoleCategory = Field(
        default=RoleCategory.USER,
        alias="custom:roleCategory"
    )

    permissions: List[str] = Field(default_factory=list)

    profile_id: Optional[str] = Field(
        default=None,
        alias="custom:profileId"
    )

    @classmethod
    def from_event(cls, event: dict) -> Optional["User"]:
        """Function to create a user object from the API Gateway event authorizer."""

        authorizer = event.get("requestContext", {}).get("authorizer", {})

        if "jwt" in authorizer:
            claims = authorizer.get("jwt", {}).get("claims", {})
        else:
            claims = authorizer.get("claims", {})

        if not claims:
            logger.warning(f"[AUTH] No claims found in event authorizer. Authorizer payload: {authorizer}")
            return None

        permissions_raw = claims.get("custom:permissions", "[]")
        try:
            permissions = loads(permissions_raw)
            if not isinstance(permissions, list):
                permissions = []
        except (JSONDecodeError, TypeError):
            permissions = []

        filtered_permissions = [p for p in permissions if p in ALLOWED_PERMISSIONS]

        validated_data = claims.copy()
        validated_data["permissions"] = filtered_permissions

        try:
            return cls.model_validate(validated_data)
        except ValidationError as e:
            logger.error(f"[AUTH] User claims validation failed. Errors: {e.errors()}")
            logger.debug(f"[AUTH] Raw data that failed validation: {validated_data}")
            return None