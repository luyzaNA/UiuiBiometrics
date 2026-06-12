from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import internal_server_error, ok
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)
assessment_service = AssessmentService()

@inject_user()
@require_role_categories({RoleCategory.DOCTOR})
@require_roles({Role.DOCTOR, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler for GET /doctors/patients
    Returns a deduplicated list of patients for the authenticated doctor.
    """
    try:
        logger.info("[GET_DOCTOR_PATIENTS] Fetching patients for Doctor Sub: %s", user.sub)
 
        patients_list = assessment_service.get_unique_patients_by_doctor(doctor_id=user.sub)

        return ok(data=patients_list)

    except Exception:
        logger.exception("[GET_DOCTOR_PATIENTS] Failed to fetch doctor patients.")
        return internal_server_error()