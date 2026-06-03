import json
from src.auth.auth import inject_user, require_role_categories, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.user import User
from src.services.menu_service import MenuService
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)
menu_service = MenuService()

@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    """Handler for POST /menus/activate"""
    try:
        body_dict = json.loads(event.get("body") or "{}")

        menu_id = body_dict.get("menu_id")
        target_person = body_dict.get("target_person")

        if not menu_id or not target_person:
            return bad_request("Missing 'menu_id' or 'target_person' in request body.")

        logger.info(f"[ACTIVATE_MENU] Activating menu {menu_id} for target {target_person} (User: {user.sub})")

        success = menu_service.activate_menu(
            cognito_sub=user.sub,
            menu_id=menu_id,
            target_person=target_person
        )

        if success:
            return ok(data={"message": "Menu successfully activated and previous menus archived."})
        else:
            return bad_request("Could not activate the specified menu.")

    except json.JSONDecodeError:
        logger.error("[ACTIVATE_MENU] Invalid JSON body.")
        return bad_request("Invalid JSON format in the request body.")
    except ValueError as ve:
        logger.error(f"[ACTIVATE_MENU] UUID Parsing error: {str(ve)}")
        return bad_request("Invalid menu_id format.")
    except Exception as e:
        logger.exception(f"[ACTIVATE_MENU] Unexpected error: {str(e)}")
        return internal_server_error("An error occurred while activating the menu.")