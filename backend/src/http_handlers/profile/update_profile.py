"""Handler for profile update endpoint."""

from json import loads
from pydantic import ValidationError

from src.auth.auth import inject_user, require_roles
from src.http_handlers.exceptions import NotFoundException
from src.http_handlers.profile_requests import UpdateProfileRequest
from src.models.user import User
from src.utils.enums import Role
from src.http_handlers.common import ok, bad_request, internal_server_error, not_found
from src.utils.service_loader import get_profile_service
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.logger import get_logger

logger = get_logger(__name__)


@inject_user()
@require_roles({Role.USER, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler to update the logged-in user's profile.
    Uses the Cognito Sub from the token directly, no path parameters required.
    """
    try:
        logger.info("[UPDATE_PROFILE] Started for Cognito Sub: %s", user.sub)

        data = loads(event.get("body") or "{}")
        update_req = UpdateProfileRequest(**data)

        updated_profile = get_profile_service().update_profile(
            request=update_req,
            cognito_sub=user.sub
        )

        logger.info("[UPDATE_PROFILE] Successfully updated profile for Sub: %s", user.sub)

        return ok(data=updated_profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except ValidationError as e:
        logger.exception("[UPDATE_PROFILE] Validation failed.")
        return bad_request(str(e))
    except NotFoundException:
        logger.info("[UPDATE_PROFILE] Profile not found for sub: %s", user.sub)
        return not_found("Profile not found.")
    except Exception:  # pylint: disable=broad-except
        logger.exception("[UPDATE_PROFILE] Unexpected error occurred.")
        return internal_server_error()