from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import ok, internal_server_error
from src.models.user import User
from src.services.admin_service import CognitoAdminService
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

cognito_service = CognitoAdminService()

@inject_user()
@require_role_categories({RoleCategory.ADMIN})
@require_roles({Role.ADMIN})
def get_user_counts_handler(event, context, user: User):
    """GET /api/admin/users/stats"""
    try:
        result = cognito_service.get_user_counts()
        return ok(data=result)

    except Exception as e:
        logger.exception("[ADMIN] Failed to get user counts.")
        return internal_server_error()