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
    Handler to get the statistics of reviewed assessments for the authenticated doctor.
    """
    try:
        doctor_id = user.sub
        logger.info("[GET_REVIEWED_STATS] Fetching reviewed stats for Doctor ID: %s", doctor_id)

        assessment_service = AssessmentService()
        stats = assessment_service.get_reviewed_assessments_stats(doctor_id)

        return ok(data=stats)

    except Exception as e:
        logger.exception("[GET_REVIEWED_STATS] Failed to retrieve reviewed stats. Error: %s", str(e))
        return internal_server_error()