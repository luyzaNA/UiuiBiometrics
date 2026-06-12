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
    Handler to retrieve a specific doctor's profile by their ID (Cognito Sub).
    """
    try:
        path_params = event.get("pathParameters") or {}
        doctor_id = path_params.get("doctor_id")

        if not doctor_id:
            return bad_request("doctor_id is required in the path parameters.")

        logger.info("[GET_DOCTOR_BY_ID] Fetching doctor profile for ID: %s", doctor_id)

        doctor_service = DoctorService()

        profile: DoctorProfileModel = doctor_service.get_doctor_by_sub(cognito_sub=doctor_id)

        return ok(data=profile.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except NotFoundException:
        logger.info("[GET_DOCTOR_BY_ID] No profile found for doctor")
        return bad_request(f"Doctor profile not found.")
    except Exception: # pylint: disable=broad-except
        logger.exception("[GET_DOCTOR_BY_ID] Unexpected error.")
        return internal_server_error()