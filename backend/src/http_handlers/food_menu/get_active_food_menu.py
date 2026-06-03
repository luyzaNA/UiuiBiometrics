from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.user import User
from src.services.food_menu_service import FoodMenuService
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)
food_menu_service = FoodMenuService()

@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    try:
        query_params = event.get("queryStringParameters") or {}
        target_person = query_params.get("target_person")

        if not target_person:
            return bad_request("Missing 'target_person' query parameter.")

        logger.info("[GET_ACTIVE_MENU] Fetching for Sub: %s, Target: %s", user.sub, target_person)

        menu = food_menu_service.get_active_protocol_for_person(
            cognito_sub=user.sub,
            target_person=target_person
        )

        if not menu:
            return ok(data=None)

        return ok(data=menu.model_dump(exclude=MODEL_EXCLUDED_KEYS))

    except Exception:
        logger.exception("[GET_ACTIVE_MENU] Failed to fetch active menu.")
        return internal_server_error()