import json
from src.auth.auth import inject_user, require_role_categories, require_roles
from src.http_handlers.common import internal_server_error, ok
from src.models.user import User
from src.services.menu_service import MenuService
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)
menu_service = MenuService()

@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """Handler for GET /menus/history"""
    try:
        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person")

        logger.info(f"[GET_MENU_HISTORY] Fetching history for user: {user.sub}, target_person: {target_person}")

        menus = menu_service.get_all_menus_history(
            cognito_sub=user.sub,
            target_person=target_person
        )

        serialized_menus = [menu.model_dump(exclude=MODEL_EXCLUDED_KEYS) for menu in menus]

        return ok(data=serialized_menus)

    except Exception as e:
        logger.exception(f"[GET_MENU_HISTORY] Unexpected error: {str(e)}")
        return internal_server_error("An error occurred while fetching the menu history.")