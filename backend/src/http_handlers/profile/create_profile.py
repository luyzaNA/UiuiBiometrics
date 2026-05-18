"""Handler for POST /profiles endpoint."""

from json import JSONDecodeError, dumps, loads

from pydantic import ValidationError
from pygments.lexer import ProfilingRegexLexer

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error
from src.http_handlers.profile_requests import CreateProfileRequest
from src.models.profile.profile_model import ProfileModel
from src.models.user import User
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger
from src.utils.service_loader import get_profile_service

from src.http_handlers.common import ok

logger = get_logger(__name__)


@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """
    Handler for POST /profiles endpoint.

    This endpoint is called when a user completes the Age/Gender quiz.
    """
    try:
        logger.info("PATH: %s", event.get("path"))
        logger.info("RAW PATH: %s", event.get("rawPath"))
        logger.info("RESOURCE: %s", event.get("resource"))
        logger.info("[CREATE_PROFILE] Started for Cognito Sub: %s", user.sub)

        data_dict = loads(event.get("body") or "{}")

        profile_request: CreateProfileRequest = CreateProfileRequest(**data_dict)

        profile: ProfileModel = get_profile_service().create_profile(
            request=profile_request,
            cognito_sub=user.sub
        )

        logger.info("[CREATE_PROFILE] Profile created. Id: %s", profile.profile_id)

        profile.avatar_url = get_profile_service().get_signed_url_from_s3(profile.avatar_key)

        return ok(data=profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except JSONDecodeError:
        logger.exception("[CREATE_PROFILE] Failed. Invalid JSON body.")
        return bad_request(
            "The request body contains invalid JSON. Please check the format."
        )
    except ValidationError as e:
        logger.exception("[CREATE_PROFILE] Failed. Validation error (Age/Gender missing).")
        return bad_request(e)
    except Exception:  # pylint: disable=broad-except
        logger.exception("[CREATE_PROFILE] Failed. Internal server error.")
        return internal_server_error()