"""Handler for GET /assessments endpoint."""

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import internal_server_error, ok
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.services.profile_service import get_signed_url_from_s3
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

assessment_service = AssessmentService()


@inject_user()
@require_role_categories({RoleCategory.USER, RoleCategory.ADMIN})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    try:
        logger.info("[GET_ASSESSMENTS] Started for user %s", user.sub)

        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person")

        assessments = assessment_service.get_user_assessments(
            cognito_sub=user.sub,
            target_person=target_person
        )

        serialized_data = []

        for assessment in assessments:
            data = assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS)

            doctor = data.get("doctor_details") or {}

            avatar_key = doctor.get("avatar_key")

            doctor_details = {
                "doctorId": doctor.get("doctor_id"),
                "full_name": doctor.get("full_name"),
                "bio": doctor.get("bio"),
                "avatarKey": avatar_key,
                "avatarUrl": get_signed_url_from_s3(avatar_key) if avatar_key else None,
            }
            data["doctorDetails"] = doctor_details

            serialized_data.append(data)

        return ok(data=serialized_data)

    except Exception:
        logger.exception("[GET_ASSESSMENTS] Failed")
        return internal_server_error()