import json
from json import JSONDecodeError
from pydantic import ValidationError

from src.auth.auth import inject_user, require_role_categories, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.user import User
from src.services.menu_service import MenuService
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)


@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def create_meal_menu_handler(event, context, user: User):
    """
    Handler for POST /menu/meals endpoint.
    Takes the stitched full_menu_data from the progressive frontend wizard and saves it to DynamoDB.
    """
    try:
        logger.info(f"[SAVE_ASSEMBLED_MEAL_MENU] Started for Cognito Sub: {user.sub}")

        menu_service = MenuService()

        body_dict = json.loads(event.get("body") or "{}")
        assessment_id = body_dict.get("assessment_id")
        deficiencies_list = body_dict.get("deficiencies", [])
        full_menu_data = body_dict.get("full_menu_data")

        if not assessment_id or not full_menu_data:
            return bad_request("Missing 'assessment_id' or 'full_menu_data' dictionary in request body.")

        menu = menu_service.save_assembled_meal_menu(
            assessment_id=assessment_id,
            deficiencies_list=deficiencies_list,
            full_menu_data=full_menu_data,
            cognito_sub=user.sub
        )

        logger.info(f"[SAVE_ASSEMBLED_MEAL_MENU] Successfully saved complete meal menu for Sub: {user.sub}")

        return ok(data=menu.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except JSONDecodeError:
        logger.exception("[SAVE_ASSEMBLED_MEAL_MENU] Invalid JSON in request body.")
        return bad_request("Invalid JSON format in the request body.")
    except ValidationError as e:
        logger.exception("[SAVE_ASSEMBLED_MEAL_MENU] Pydantic validation rejected compiled structural layout.")
        return bad_request(f"Data structure integrity violation: {str(e)}")
    except Exception as e:
        logger.exception(f"[SAVE_ASSEMBLED_MEAL_MENU] Unexpected internal service error: {str(e)}")
        return internal_server_error("An unexpected error occurred while saving the assembled meal menu.")