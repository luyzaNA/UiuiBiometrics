from src.auth.auth import inject_user, require_roles
from src.http_handlers.common import internal_server_error, ok
from src.models.user import User
from src.utils.enums import Role
from src.utils.logger import get_logger
from src.services.assessment_service import AssessmentService

logger = get_logger(__name__)

@inject_user()
@require_roles({Role.DOCTOR})
def handler(event, context, user: User):
    """
    Handler to get the list of pending assessments for a specific doctor.
    """
    try:
        doctor_id = user.sub
        logger.info("[GET_PENDING_ASSESSMENTS] Fetching pending assessments for Doctor ID: %s", doctor_id)

        assessment_service = AssessmentService()
        assessments = assessment_service.get_pending_assessments(doctor_id)

        data = [assessment.model_dump(exclude_none=True) for assessment in assessments]

        return ok(data=data)

    except Exception as e:
        logger.exception("[GET_PENDING_ASSESSMENTS] Failed to retrieve pending assessments. Error: %s", str(e))
        return internal_server_error()