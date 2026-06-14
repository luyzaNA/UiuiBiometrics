from src.auth.auth import inject_user, require_roles
from src.http_handlers.common import internal_server_error, ok
from src.models.user import User
from src.utils.enums import Role
from src.utils.logger import get_logger
from src.services.assessment_service import AssessmentService

logger = get_logger(__name__)

assessment_service = AssessmentService()

@inject_user()
@require_roles({Role.DOCTOR})
def handler(event, context, user: User):
    """
    Handler to get the exact count of pending assessments for a specific doctor.
    """
    try:
        doctor_id = user.sub
        logger.info("[GET_PENDING_ASSESSMENTS_COUNT] Fetching count for Doctor ID: %s", doctor_id)

        data = assessment_service.count_pending_assessments(doctor_id)

        return ok(data=data)

    except Exception as e:
        logger.exception("[GET_PENDING_ASSESSMENTS_COUNT] Failed to retrieve pending assessments count. Error: %s", str(e))
        return internal_server_error()