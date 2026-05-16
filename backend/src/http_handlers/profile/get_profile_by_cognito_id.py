"""Handler for GET /profile/me endpoint."""

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error
from src.http_handlers.exceptions import NotFoundException
from src.models.profile.profile_model import ProfileModel
from src.models.user import User
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums  import Role, RoleCategory
from src.utils.logger import get_logger
from src.utils.service_loader import get_profile_service

from src.http_handlers.common import ok

logger = get_logger(__name__)


@inject_user()
@require_roles({Role.USER, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler to retrieve the logged-in user's profile using their Cognito Sub.

    """
    try:
        logger.info("[PROFILE_ME] Fetching profile for Cognito Sub: %s", user.sub)

        profile: ProfileModel = get_profile_service().get_profile_by_sub(
            cognito_sub=user.sub
        )

        logger.info("[PROFILE_ME] Successfully retrieved Profile ID: %s", profile.profile_id)

        return ok(data=profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except NotFoundException:
        logger.info("[PROFILE_ME] No profile found for sub: %s. User needs onboarding.", user.sub)
        return bad_request("Profile not found. Please complete the onboarding quiz.")

    except Exception:  # pylint: disable=broad-except
        logger.exception("[PROFILE_ME] Unexpected error occurred.")
        return internal_server_error()