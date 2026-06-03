"""Handler for food menu activation endpoint."""

from json import loads
from pydantic import ValidationError

from src.auth.auth import inject_user, require_roles
from src.http_handlers.create_food_menu_request import ActivateMenuRequest
from src.http_handlers.exceptions import NotFoundException
from src.models.user import User
from src.utils.enums import Role
from src.http_handlers.common import ok, bad_request, internal_server_error, not_found
from src.utils.service_loader import get_food_menu_service
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.logger import get_logger

logger = get_logger(__name__)


@inject_user()
@require_roles({Role.USER, Role.ADMIN})
def handler(event, context, user: User):
    """
    Handler to transition a menu from DRAFT to ACTIVE.
    Uses the Cognito Sub from the token to enforce data isolation.
    """
    try:
        logger.info("[ACTIVATE_MENU] Started for Cognito Sub: %s", user.sub)

        data = loads(event.get("body") or "{}")
        request_req = ActivateMenuRequest(**data)

        activated_menu = get_food_menu_service().activate_menu(
            menu_id=request_req.menu_id,
            cognito_sub=user.sub
        )

        logger.info("[ACTIVATE_MENU] Successfully activated menu %s for Sub: %s", request_req.menu_id, user.sub)

        return ok(data=activated_menu.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except ValidationError as e:
        logger.exception("[ACTIVATE_MENU] Validation failed.")
        return bad_request(str(e))
    except NotFoundException:
        logger.info("[ACTIVATE_MENU] Menu not found or unauthorized for sub: %s", user.sub)
        return not_found("The requested menu protocol was not found.")
    except Exception:  # pylint: disable=broad-except
        logger.exception("[ACTIVATE_MENU] Unexpected error occurred.")
        return internal_server_error()