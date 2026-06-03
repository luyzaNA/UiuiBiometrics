import json
from src.auth.auth import inject_user, require_role_categories, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok, not_found
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
    """Handler for GET /menus/active/{target_person}"""
    try:
        path_params = event.get("pathParameters") or {}
        target_person = path_params.get("target_person")

        if not target_person:
            return bad_request("Missing 'target_person' in path parameters.")

        logger.info(f"[GET_ACTIVE_MENU] Fetching active menu for target: {target_person} (User: {user.sub})")

        active_menu = menu_service.get_active_menu_by_target(
            cognito_sub=user.sub,
            target_person=target_person
        )

        if not active_menu:
            return ok(data=None)

        return ok(data=active_menu.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except Exception as e:
        logger.exception(f"[GET_ACTIVE_MENU] Unexpected error: {str(e)}")
        return internal_server_error("An error occurred while fetching the active menu.")