from src.auth.auth import inject_user, require_roles
from src.http_handlers.common import ok, internal_server_error
from src.models.user import User
from src.services.notification_service import NotificationService
from src.utils.enums import Role
from src.utils.logger import get_logger

logger = get_logger(__name__)

@inject_user()
@require_roles({Role.USER, Role.DOCTOR, Role.ADMIN})
def handler(event, context, user: User):
    try:
        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)

        NotificationService().mark_all_read(
            user_pk=f"{role_str.upper()}#{user.sub}"
        )

        return ok({"success": True})

    except Exception:
        logger.exception("[MARK_ALL_NOTIFICATIONS_READ] error")
        return internal_server_error()