import boto3
from src.auth.auth import inject_user, require_roles, require_role_categories
from src.http_handlers.admin_request import UpdateUserRoleRequest
from src.http_handlers.common import ok, internal_server_error, bad_request
from src.models.user import User
from src.services.admin_service import CognitoAdminService
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger
from pydantic import ValidationError
from json import JSONDecodeError, loads

logger = get_logger(__name__)

cognito = boto3.client('cognito-idp')
cognito_service = CognitoAdminService()

@inject_user()
@require_role_categories({RoleCategory.ADMIN})
@require_roles({Role.ADMIN})
def update_user_role_handler(event, context, user: User):
    """POST /api/admin/users/{username}/roles"""
    try:
        path_params = event.get("pathParameters") or {}
        target_username = path_params.get("username")

        if not target_username:
            return bad_request("Missing username in path parameters.")

        data_dict = loads(event.get("body") or "{}")
        request_data = UpdateUserRoleRequest(**data_dict)

        if request_data.action == "add":
            cognito_service.assign_user_to_group(target_username, request_data.group_name)
        elif request_data.action == "remove":
            cognito_service.remove_user_from_group(target_username, request_data.group_name)

        logger.info(f"[ADMIN] User {target_username} role {request_data.group_name} updated successfully by {user.sub}")
        return ok({"message": f"Successfully updated {request_data.group_name} for user {target_username}"})

    except JSONDecodeError:
        return bad_request("Invalid JSON body.")
    except ValidationError as e:
        return bad_request(str(e))
    except Exception as e:
        logger.exception("[ADMIN] Failed to update user role.")
        return internal_server_error()