import boto3
from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.common import ok, internal_server_error
from src.models.user import User
from src.services.admin_service import CognitoAdminService
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

cognito = boto3.client('cognito-idp')
cognito_service = CognitoAdminService()

@inject_user()
@require_role_categories({RoleCategory.ADMIN})
@require_roles({Role.ADMIN})
def list_cognito_users_handler(event, context, user: User):
    """GET /api/admin/users"""
    try:
        query_params = event.get("queryStringParameters") or {}
        pagination_token = query_params.get("token")

        result = cognito_service.list_users(limit=50, pagination_token=pagination_token)
        return ok(data=result)

    except Exception as e:
        logger.exception("[ADMIN] Failed to list Cognito users.")
        return internal_server_error()