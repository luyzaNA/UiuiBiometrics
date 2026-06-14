from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import internal_server_error, ok
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.services.profile_service import get_signed_url_from_s3
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory, AssessmentStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)

assessment_service = AssessmentService()

@inject_user()
@require_role_categories({RoleCategory.USER, RoleCategory.ADMIN})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    try:
        logger.info("[GET_PENDING_ASSESSMENTS] Started for user %s", user.sub)

        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person")

        target_statuses = ["PENDING_DOCTOR", "DOCTOR_REVIEWED"]

        assessments = []

        for status in target_statuses:
            fetched_assessments = assessment_service.get_user_assessments_by_status(
                cognito_sub=user.sub,
                status=status,
                target_person=target_person
            )
            if fetched_assessments:
                assessments.extend(fetched_assessments)

        serialized_data = []

        for assessment in assessments:
            data = assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS)

            doctor = data.pop("doctor_details", None)

            if doctor:
                if doctor.get("avatar_key"):
                    doctor["avatar_url"] = get_signed_url_from_s3(doctor["avatar_key"])

            data["doctorDetails"] = doctor

            serialized_data.append(data)

        return ok(data=serialized_data)

    except Exception:
        logger.exception("[GET_PENDING_ASSESSMENTS] Failed")
        return internal_server_error()