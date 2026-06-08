from json import loads
from pydantic import ValidationError

from src.auth.auth import inject_user, require_roles
from src.http_handlers.doctor_request import UpdateDoctorProfileRequest
from src.http_handlers.exceptions import NotFoundException
from src.models.user import User
from src.utils.enums import Role
from src.http_handlers.common import ok, bad_request, internal_server_error, not_found
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.logger import get_logger
from src.services.doctor_service import DoctorService

logger = get_logger(__name__)


@inject_user()
@require_roles({Role.DOCTOR, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler to partially update the authenticated doctor's profile data.
    """
    try:
        logger.info("[UPDATE_DOCTOR_PROFILE] Started for Cognito Sub: %s", user.sub)

        data = loads(event.get("body") or "{}")
        update_req = UpdateDoctorProfileRequest(**data)

        doctor_service = DoctorService()
        updated_profile = doctor_service.update_profile(
            request=update_req,
            cognito_sub=user.sub
        )

        return ok(data=updated_profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except ValidationError as e:
        logger.exception("[UPDATE_DOCTOR_PROFILE] Validation failed.")
        return bad_request(str(e))
    except NotFoundException:
        return not_found("Doctor profile not found.")
    except Exception: # pylint: disable=broad-except
        logger.exception("[UPDATE_DOCTOR_PROFILE] Critical error.")
        return internal_server_error()