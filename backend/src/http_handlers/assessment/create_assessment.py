"""Handler for POST /assessments endpoint."""

from json import JSONDecodeError, loads
from pydantic import ValidationError

from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.assessment_request import CreateAssessmentRequest
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.assessment.assessment_model import AssessmentModel
from src.models.user import User
from src.services.assessment_service import AssessmentService
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

assessment_service = AssessmentService()


@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """
    Handler for POST /assessments endpoint.

    This endpoint is called when a user submits their active symptoms.
    It triggers the Random Forest ML pipeline to compute micronutrient deficiencies.
    """
    try:
        logger.info("[CREATE_ASSESSMENT] Started for Cognito Sub: %s", user.sub)

        data_dict = loads(event.get("body") or "{}")

        assessment_request = CreateAssessmentRequest(**data_dict)

        assessment: AssessmentModel = assessment_service.create_assessment(
            request=assessment_request,
            cognito_sub=user.sub
        )

        logger.info("[CREATE_ASSESSMENT] ML Pipeline executed and saved successfully for Sub: %s", user.sub)

        return ok(data=assessment.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except JSONDecodeError:
        logger.exception("[CREATE_ASSESSMENT] Failed. Invalid JSON body.")
        return bad_request(
            "The request body contains invalid JSON. Please check the format."
        )
    except ValidationError as e:
        logger.exception("[CREATE_ASSESSMENT] Failed. Validation error (Data structure mismatch).")
        return bad_request(str(e))
    except Exception:  # pylint: disable=broad-except
        logger.exception("[CREATE_ASSESSMENT] Failed. Internal server error.")
        return internal_server_error()