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
def generate_partial_meal_handler(event, context, user: User):
    """
    Handler for POST /menu/meals/generate endpoint.
    Only generates a specific category of meals (breakfasts, lunches, etc.) via AI. No DB save.
    """
    try:
        logger.info(f"[GENERATE_PARTIAL_MEALS] Started for Cognito Sub: {user.sub}")

        menu_service = MenuService()

        body_dict = json.loads(event.get("body") or "{}")
        deficiencies_list = body_dict.get("deficiencies", [])
        meal_category = body_dict.get("meal_category")

        if not deficiencies_list or not meal_category:
            return bad_request("Missing 'deficiencies' array or 'meal_category' in request body.")

        allowed_categories = {"breakfasts", "lunches", "dinners", "snacks"}
        if meal_category not in allowed_categories:
            return bad_request(f"Invalid meal_category. Must be one of {allowed_categories}")

        ai_result = menu_service.generate_partial_meal_category(
            deficiencies_list=deficiencies_list,
            category=meal_category
        )

        logger.info(f"[GENERATE_PARTIAL_MEALS] Successfully generated {meal_category} for Sub: {user.sub}")

        return ok(data=ai_result)

    except JSONDecodeError:
        logger.exception("[GENERATE_PARTIAL_MEALS] Invalid JSON in request body.")
        return bad_request("Invalid JSON format in the request body.")
    except ValueError as e:
        logger.error(f"[GENERATE_PARTIAL_MEALS] Config Error: {str(e)}")
        return internal_server_error("Server configuration error.")
    except Exception as e:
        logger.exception(f"[GENERATE_PARTIAL_MEALS] Unexpected internal error: {str(e)}")
        return internal_server_error("An unexpected error occurred while generating partial meals.")
