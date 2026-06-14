"""Handler for GET /assessments/{assessmentId} endpoint."""

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import internal_server_error, ok, bad_request
from src.http_handlers.exceptions import NotFoundException
from src.models.assessment.assessment_model import AssessmentModel
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.services.profile_service import get_signed_url_from_s3
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)
assessment_service = AssessmentService()

@inject_user()
@require_role_categories({RoleCategory.USER, RoleCategory.ADMIN, RoleCategory.DOCTOR})
@require_roles({Role.ADMIN, Role.USER, Role.DOCTOR})
def handler(event, context, user: User):
    try:
        path_params = event.get("pathParameters") or {}
        assessment_id = path_params.get("assessmentId")
        cognito_sub = path_params.get("cognitoSub")
        if not assessment_id or not cognito_sub:
            return bad_request("assessmentId and cognitoSub are required in path parameters.")

        logger.info("[GET_ASSESSMENT_BY_ID] Fetching assessment  for ID: %s", assessment_id)

        assessment: AssessmentModel = assessment_service.get_assessment_by_id(cognito_sub=cognito_sub, assessment_id=assessment_id)

        return ok(data=assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except NotFoundException:
        logger.info("[GET_ASSESSMENT_BY_ID] No assessment found")
        return bad_request(f"Assessment not found.")
    except Exception: # pylint: disable=broad-except
        logger.exception("[GET_ASSESSMENT_BY_ID] Unexpected error.")
        return internal_server_error()