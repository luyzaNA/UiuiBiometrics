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
def handler(event, context, user: User):
    """
    Handler for POST /menu/food endpoint.
    """
    try:
        logger.info(f"[CREATE_FOOD_MENU] Started for Cognito Sub: {user.sub}")

        menu_service = MenuService()

        body_dict = json.loads(event.get("body") or "{}")
        deficiencies_list = body_dict.get("deficiencies", [])
        assessment_id = body_dict.get("assessment_id")

        if not assessment_id or not deficiencies_list:
            return bad_request("Missing 'assessment_id' or 'deficiencies' array in request body.")

        menu = menu_service.generate_and_create_food_menu(
            assessment_id=assessment_id,
            deficiencies_list=deficiencies_list,
            cognito_sub=user.sub
        )

        logger.info(f"[CREATE_FOOD_MENU] Successfully created food menu for Sub: {user.sub}")

        return ok(data=menu.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except JSONDecodeError:
        logger.exception("[CREATE_FOOD_MENU] Invalid JSON in request body.")
        return bad_request("Invalid JSON format in the request body.")
    except ValidationError as e:
        logger.exception("[CREATE_FOOD_MENU] Pydantic validation rejected AI structural output.")
        return bad_request(f"Data structure integrity violation: {str(e)}")
    except ValueError as e:
        logger.error(f"[CREATE_FOOD_MENU] Config Error: {str(e)}")
        return internal_server_error("Server configuration error.")
    except Exception as e:
        logger.exception(f"[CREATE_FOOD_MENU] Unexpected internal service error: {str(e)}")
        return internal_server_error("An unexpected error occurred while processing the nutritional protocol.")