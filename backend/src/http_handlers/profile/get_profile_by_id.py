from src.auth.auth import inject_user, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.http_handlers.exceptions import NotFoundException
from src.models.profile.profile_model import ProfileModel
from src.models.user import User
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role
from src.utils.logger import get_logger
from src.utils.service_loader import get_profile_service

logger = get_logger(__name__)

@inject_user()
@require_roles({Role.ADMIN, Role.DOCTOR})
def handler(event, context, user: User):
    """
    Handler to retrieve a specific user's profile using a Cognito Sub from the URL path.
    """
    try:
        path_parameters = event.get("pathParameters") or {}
        target_sub = path_parameters.get("cognito_sub")

        if not target_sub:
            return bad_request("Missing cognito_sub in path parameters.")

        logger.info("[GET_PROFILE_BY_SUB] User %s is fetching profile for target Cognito Sub: %s", user.sub, target_sub)

        profile: ProfileModel = get_profile_service().get_profile_by_sub(
            cognito_sub=target_sub
        )

        logger.info("[GET_PROFILE_BY_SUB] Successfully retrieved Profile ID: %s", profile.profile_id)

        return ok(data=profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except NotFoundException:
        logger.info("[GET_PROFILE_BY_SUB] No profile found for sub: %s.", target_sub)
        return bad_request("Profile not found for the requested user.")

    except Exception:  # pylint: disable=broad-except
        logger.exception("[GET_PROFILE_BY_SUB] Unexpected error occurred.")
        return internal_server_error()