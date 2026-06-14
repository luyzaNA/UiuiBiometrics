import json
from pydantic import ValidationError

from src.auth.auth import inject_user, require_roles
from src.http_handlers.doctor_request import CreateDoctorReviewRequest
from src.http_handlers.exceptions import NotFoundException
from src.models.user import User
from src.utils.enums import Role
from src.http_handlers.common import ok, bad_request, internal_server_error, not_found
from src.utils.logger import get_logger
from src.services.doctor_service import DoctorService

logger = get_logger(__name__)

@inject_user()
@require_roles({Role.USER})
def handler(event, context, user: User):
    try:
        doctor_id = event.get("pathParameters", {}).get("doctor_id")
        if not doctor_id:
            return bad_request("Missing doctor_id path parameter")

        body = json.loads(event.get("body") or "{}")
        request = CreateDoctorReviewRequest(**body)

        doctor_service = DoctorService()
        review = doctor_service.add_review(doctor_id, user, request)

        return ok(data=review.model_dump())

    except ValidationError as e:
        return bad_request(str(e))
    except NotFoundException:
        return not_found("Doctor not found.")
    except Exception as e:
        logger.exception("[ADD_DOCTOR_REVIEW] Critical error.")
        return internal_server_error()