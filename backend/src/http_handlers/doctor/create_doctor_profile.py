from json import JSONDecodeError, loads
from pydantic import ValidationError

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.http_handlers.doctor_request import CreateDoctorProfileRequest
from src.models.profile.doctor.profile_doctor_model import DoctorProfileModel
from src.models.user import User
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger
from src.services.doctor_service import DoctorService

logger = get_logger(__name__)


@inject_user()
@require_role_categories({RoleCategory.DOCTOR})
@require_roles({Role.ADMIN, Role.DOCTOR})
def handler(event, context, user: User):
    """
    Handler for POST /doctors/profile endpoint.
    Initializes a professional profile for an authenticated specialist doctor.
    """
    try:
        logger.info("[CREATE_DOCTOR_PROFILE] Started for Cognito Sub: %s", user.sub)

        data_dict = loads(event.get("body") or "{}")
        profile_request = CreateDoctorProfileRequest(**data_dict)

        doctor_service = DoctorService()
        profile: DoctorProfileModel = doctor_service.create_profile(
            request=profile_request,
            cognito_sub=user.sub
        )

        logger.info("[CREATE_DOCTOR_PROFILE] Profile created successfully for Doctor Sub: %s", user.sub)
        return ok(data=profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except JSONDecodeError:
        logger.exception("[CREATE_DOCTOR_PROFILE] Failed due to invalid JSON.")
        return bad_request("The request body contains invalid JSON.")
    except ValidationError as e:
        logger.exception("[CREATE_DOCTOR_PROFILE] Validation failed.")
        return bad_request(str(e))
    except Exception: # pylint: disable=broad-except
        logger.exception("[CREATE_DOCTOR_PROFILE] Critical failure.")
        return internal_server_error()