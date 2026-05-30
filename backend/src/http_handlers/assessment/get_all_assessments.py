"""Handler for GET /assessments endpoint."""

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

assessment_service = AssessmentService()

@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """
    Handler for GET /assessments endpoint.

    Expected Query Parameter:
    - target_person (e.g., ?target_person=Principal)
    """
    try:
        logger.info("[GET_ASSESSMENTS] Started for Cognito Sub: %s", user.sub)

        assessments = assessment_service.get_user_assessments(cognito_sub=user.sub)

        logger.info("[GET_ASSESSMENTS] Found %d total assessments for Sub: %s", len(assessments), user.sub)

        serialized_data = [
            assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS)
            for assessment in assessments
        ]

        return ok(data=serialized_data)

    except Exception:  # pylint: disable=broad-except
        logger.exception("[GET_ASSESSMENTS] Failed. Internal server error.")
        return internal_server_error()