from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.services.doctor_service import DoctorService
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

assessment_service = AssessmentService()
doctor_service = DoctorService()
@inject_user()
@require_role_categories({RoleCategory.USER, RoleCategory.ADMIN})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    try:
        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person")

        assessments = assessment_service.get_user_assessments(
            cognito_sub=user.sub,
            target_person=target_person
        )

        serialized_data = []

        for assessment in assessments:
            assessment_dict = assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS)

            if assessment.doctor_id and assessment.doctor_id != "UNASSIGNED":
                try:
                    doctor = doctor_service.get_doctor_by_sub(assessment.doctor_id)
                    if doctor:
                        assessment_dict["doctorDetails"] = {
                            "name": doctor.name,
                            "avatarUrl": doctor.avatar_url,
                            "bio": doctor.bio,
                            "price": doctor.price
                        }
                    else:
                        assessment_dict["doctorDetails"] = None
                except Exception:
                    assessment_dict["doctorDetails"] = None
            else:
                assessment_dict["doctorDetails"] = None

            serialized_data.append(assessment_dict)

        return ok(data=serialized_data)

    except Exception:
        logger.exception("[GET_ALL_ASSESSMENTS] Failed.")
        return internal_server_error()