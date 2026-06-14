"""Handler for GET /assessments/{cognitoSub}/history/summary endpoint."""

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import internal_server_error, ok, bad_request
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

assessment_service = AssessmentService()

@inject_user()
@require_role_categories({RoleCategory.DOCTOR, RoleCategory.ADMIN})
@require_roles({Role.ADMIN, Role.USER, Role.DOCTOR})
def handler(event, context, user: User):
    try:
        path_params = event.get("pathParameters") or {}
        cognito_sub = path_params.get("cognitoSub")

        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person")

        if not cognito_sub or not target_person:
            return bad_request()

        logger.info(f"[GET_HISTORY_SUMMARY] Requested by {user.sub} for patient {cognito_sub}, target: {target_person}")

        summary_data = assessment_service.generate_patient_history_summary(
            cognito_sub=cognito_sub,
            target_person=target_person
        )

        if summary_data.get("success") is False:
            return bad_request()

        return ok(data=summary_data)

    except Exception as e:
        logger.exception("[GET_HISTORY_SUMMARY] Failed to generate AI history summary")
        return internal_server_error(message="An error occurred while generating the summary.")