from src.auth.auth import inject_user, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok, not_found
from src.http_handlers.exceptions import NotFoundException
from src.models.user import User
from src.utils.enums import Role
from src.utils.logger import get_logger
from src.services.doctor_service import DoctorService

logger = get_logger(__name__)

@inject_user()
@require_roles({Role.DOCTOR, Role.USER, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler to retrieve a specific doctor's profile along with their reviews by their ID (Cognito Sub).
    """
    try:
        path_params = event.get("pathParameters") or {}
        doctor_id = path_params.get("doctor_id")

        if not doctor_id:
            return bad_request("doctor_id is required in the path parameters.")

        logger.info("[GET_DOCTOR_BY_ID] Fetching doctor profile and reviews for ID: %s", doctor_id)

        doctor_service = DoctorService()

        doctor_data = doctor_service.get_doctor_profile_with_reviews(doctor_sub=doctor_id)

        return ok(data=doctor_data)

    except NotFoundException:
        logger.info("[GET_DOCTOR_BY_ID] No profile found")
        return not_found("Doctor profile not found.")
    except Exception: # pylint: disable=broad-except
        logger.exception("[GET_DOCTOR_BY_ID] Unexpected error.")
        return internal_server_error()