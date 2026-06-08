from src.auth.auth import inject_user, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.http_handlers.exceptions import NotFoundException
from src.models.profile.doctor.profile_doctor_model import DoctorProfileModel
from src.models.user import User
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role
from src.utils.logger import get_logger
from src.services.doctor_service import DoctorService

logger = get_logger(__name__)


@inject_user()
@require_roles({Role.DOCTOR, Role.USER, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler to retrieve the logged-in doctor's personal profile.
    """
    try:
        logger.info("[DOCTOR_PROFILE_ME] Fetching for Cognito Sub: %s", user.sub)

        doctor_service = DoctorService()
        profile: DoctorProfileModel = doctor_service.get_doctor_by_sub(cognito_sub=user.sub)

        return ok(data=profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except NotFoundException:
        logger.info("[DOCTOR_PROFILE_ME] No profile found for doctor sub: %s", user.sub)
        return bad_request("Doctor profile not found. Please complete onboarding.")
    except Exception: # pylint: disable=broad-except
        logger.exception("[DOCTOR_PROFILE_ME] Unexpected error.")
        return internal_server_error()