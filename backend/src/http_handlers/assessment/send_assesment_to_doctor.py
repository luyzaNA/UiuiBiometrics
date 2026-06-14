"""Handler for PUT /assessments/{assessmentId}/send-to-doctor."""

from json import loads, JSONDecodeError

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.assessment.assessment_model import DoctorDetails
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
        logger.info("[SEND_TO_DOCTOR] user=%s", user.sub)

        path_params = event.get("pathParameters") or {}
        assessment_id = path_params.get("assessmentId")

        if not assessment_id:
            return bad_request("Missing assessmentId")

        body = loads(event.get("body") or "{}")
        doctor_id = body.get("doctor_id")

        if doctor_id and doctor_id != "UNASSIGNED":
            doctor = doctor_service.get_doctor_by_sub(doctor_id)

            if not doctor:
                return bad_request("Doctor not found")
            print(doctor)
            doctor_details = DoctorDetails(
                doctor_id=doctor_id,
                full_name=doctor.full_name,
                price=float(doctor.price),
                bio=doctor.bio,
                avatar_key=getattr(doctor, "avatar_key", None),
                avatar_url=None
            )

        else:
            doctor_details = DoctorDetails(
                doctor_id="POOL",
                full_name="Specialist",
                price=0.0,
                bio="In progress",
                avatar_key=None,
                avatar_url=None
            )

        updated = assessment_service.send_to_doctor(
            cognito_sub=user.sub,
            assessment_id=assessment_id,
            doctor_details=doctor_details
        )

        data = updated.model_dump(exclude=MODEL_EXCLUDED_KEYS)
        data["doctorDetails"] = data.pop("doctor_details", None)

        return ok(data=data)

    except JSONDecodeError:
        return bad_request("Invalid JSON body")

    except ValueError as e:
        return bad_request(str(e))

    except Exception:
        logger.exception("[SEND_TO_DOCTOR] Failed")
        return internal_server_error()