from json import loads
from pydantic import ValidationError

from src.auth.auth import inject_user, require_roles
from src.http_handlers.assessment_request import UpdateDoctorNotesRequest
from src.http_handlers.exceptions import NotFoundException
from src.models.user import User
from src.utils.enums import Role
from src.http_handlers.common import ok, bad_request, internal_server_error, not_found
from src.utils.logger import get_logger
from src.services.assessment_service import AssessmentService

logger = get_logger(__name__)

@inject_user()
@require_roles({Role.DOCTOR, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler to update doctor notes and implicitly change assessment status to DOCTOR_REVIEWED.
    """
    try:
        path_params = event.get("pathParameters", {})
        cognito_sub = path_params.get("cognitoSub")
        assessment_id = path_params.get("assessmentId")

        if not cognito_sub or not assessment_id:
            return bad_request("Missing cognitoSub or assessmentId in path parameters.")

        logger.info("[UPDATE_DOCTOR_NOTES] Started for Assessment ID: %s", assessment_id)

        data = loads(event.get("body") or "{}")
        req = UpdateDoctorNotesRequest(**data)

        service = AssessmentService()
        updated_assessment = service.update_doctor_notes(
            cognito_sub=cognito_sub,
            assessment_id=assessment_id,
            doctor_notes=req.doctor_notes
        )

        return ok(data=updated_assessment.model_dump(exclude_none=True))

    except ValidationError as e:
        logger.exception("[UPDATE_DOCTOR_NOTES] Validation failed.")
        return bad_request(str(e))
    except NotFoundException:
        return not_found("Assessment not found.")
    except ValueError as e:
        logger.warning(f"[UPDATE_DOCTOR_NOTES] Business logic error: {str(e)}")
        return bad_request(str(e))
    except Exception as e:
        logger.exception("[UPDATE_DOCTOR_NOTES] Critical error.")
        return internal_server_error()