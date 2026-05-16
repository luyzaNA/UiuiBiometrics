"""Handler for GET /profiles endpoint."""

from uuid import UUID

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error
from src.http_handlers.exceptions import NotFoundException
from src.models.profile.profile_model import ProfileModel
from src.models.user import User
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger
from src.utils.service_loader import get_profile_service

from src.http_handlers.common import ok

logger = get_logger(__name__)


@inject_user()
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """
    Handler for GET /profiles endpoint.
    """

    try:
        logger.info("[PROFILE_FETCH] Started by User Sub: %s", user.sub)

        profile_id: str | None = event.get("pathParameters", {}).get("id")

        if profile_id:
            logger.info("[PROFILE_FETCH] Fetching by ID: %s", profile_id)
            profile: ProfileModel = get_profile_service().get_profile_by_id(
                profile_id=UUID(profile_id)
            )
        else:
            logger.info("[PROFILE_FETCH] Fetching current user's profile via Sub")
            profile: ProfileModel = get_profile_service().get_profile_by_sub(
                cognito_sub=user.sub
            )

        logger.info("[PROFILE_FETCH] Ended. Profile ID: %s", profile.profile_id)

        return ok(data=profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except ValueError:
        logger.warning("[PROFILE_FETCH] Invalid profile UUID provided.")
        return bad_request("The provided profile ID is not a valid UUID.")

    except NotFoundException as e:
        logger.warning("[PROFILE_FETCH] Profile not found for sub: %s", user.sub)
        return bad_request(e.message)

    except Exception:  # pylint: disable=broad-except
        logger.exception("[PROFILE_FETCH] Unexpected error.")
        return internal_server_error()