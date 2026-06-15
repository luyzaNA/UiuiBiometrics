from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import internal_server_error, ok, bad_request
from src.http_handlers.exceptions import NotFoundException
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)
assessment_service = AssessmentService()
@inject_user()
@require_role_categories({RoleCategory.USER, RoleCategory.ADMIN, RoleCategory.DOCTOR})
@require_roles({Role.ADMIN, Role.USER, Role.DOCTOR})
def handler(event, context, user: User):
    try:
        cognito_sub = user.sub

        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person", "Principal")

        logger.info(
            "[GET_LATEST_COMPARISON] Fetching comparison data for user: %s, target_person: %s",
            cognito_sub, target_person
        )

        comparison_data = assessment_service.get_latest_comparison(
            cognito_sub=cognito_sub,
            target_person=target_person
        )

        return ok(data=comparison_data)

    except NotFoundException:
        logger.info("[GET_LATEST_COMPARISON] No retake assessments found for user: %s and person: %s", cognito_sub, target_person)
        return bad_request("Nu ai nicio comparație disponibilă pentru acest profil.")
    except Exception: # pylint: disable=broad-except
        logger.exception("[GET_LATEST_COMPARISON] Unexpected error.")
        return internal_server_error()