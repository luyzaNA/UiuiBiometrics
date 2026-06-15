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
        notifications = NotificationService().get_all(
            user_pk=f"{user.role.upper()}#{user.sub}"
        )

        return ok(notifications)

    except Exception:
        logger.exception("[GET_NOTIFICATIONS] error")
        return internal_server_error()