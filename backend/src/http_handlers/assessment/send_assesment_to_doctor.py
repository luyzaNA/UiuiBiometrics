"""Handler for assigning an assessment to a doctor via PUT."""

from json import JSONDecodeError, loads
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
@require_role_categories({RoleCategory.USER, RoleCategory.ADMIN})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """
    Handler for PUT /assessments/{assessmentId}/send-to-doctor endpoint.
    """
    try:
        logger.info("[SEND_TO_DOCTOR] Started for Cognito Sub: %s", user.sub)

        path_params = event.get("pathParameters") or {}
        assessment_id = path_params.get("assessmentId") or path_params.get("assessment_id")

        if not assessment_id:
            logger.warning("[SEND_TO_DOCTOR] Missing assessmentId in path parameters.")
            return bad_request("Missing assessmentId in URL path.")

        body = loads(event.get("body") or "{}")

        doctor_cognito_sub = body.get("doctor_id") or "UNASSIGNED"

        updated_assessment = assessment_service.send_to_doctor(
            cognito_sub=user.sub,
            assessment_id=assessment_id,
            doctor_id=doctor_cognito_sub
        )

        logger.info(
            "[SEND_TO_DOCTOR] Successfully assigned assessment %s to doctor (Sub: %s)",
            assessment_id, doctor_cognito_sub
        )

        return ok(data=updated_assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except JSONDecodeError:
        logger.exception("[SEND_TO_DOCTOR] Failed. Invalid JSON body.")
        return bad_request("The request body contains invalid JSON. Please check the format.")
    except Exception:  # pylint: disable=broad-except
        logger.exception("[SEND_TO_DOCTOR] Failed. Internal server error.")
        return internal_server_error()