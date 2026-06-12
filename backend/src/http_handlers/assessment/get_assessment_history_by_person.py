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
@require_role_categories({RoleCategory.USER, RoleCategory.ADMIN, RoleCategory.DOCTOR})
@require_roles({Role.ADMIN, Role.USER, Role.DOCTOR})
def handler(event, context, user: User):
    """
    Handler for GET /assessments/history?target_person=...&cognito_sub=...
    Returns the fully mapped assessment history for a specific family member/target person.
    """
    try:
        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person")

        patient_sub = query_params.get("cognito_sub", user.sub)

        if not target_person:
            return bad_request("The 'target_person' query parameter is required.")

        assessments = assessment_service.get_history_by_target_person(
            cognito_sub=patient_sub,
            target_person=target_person
        )

        serialized_data = []

        for assessment in assessments:
            assessment_dict = assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS)

            doctor_details_obj = assessment_dict.pop("doctor_details", None)

            if doctor_details_obj:
                doctor_details_obj["avatarUrl"] = doctor_details_obj.pop("avatar_url", None)
                doctor_details_obj["doctorId"] = doctor_details_obj.pop("doctor_id", None)
                doctor_details_obj.pop("avatar_key", None)

            assessment_dict["doctorDetails"] = doctor_details_obj
            serialized_data.append(assessment_dict)

        return ok(data=serialized_data)

    except Exception:
        logger.exception("[GET_ASSESSMENT_HISTORY] Critical failure fetching history.")
        return internal_server_error()