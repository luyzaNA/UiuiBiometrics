"""Auth decorators"""

from functools import wraps
from typing import Any, Callable

from src.http_handlers.common import unauthorized, forbidden
from src.models.user import User
from src.utils.enums import Permission, Role, RoleCategory

from src.utils.logger import get_logger

logger = get_logger(__name__)

def require_permissions(required_perms: set[Permission]) -> Callable:
    """Require that the user has one of the specified permissions."""
    required_perm_values: set[str] = {perm.value for perm in required_perms}

    def decorator(func) -> Callable:
        @wraps(func)
        def wrapper(event, context, *args, **kwargs) -> Any:
            user: User | None = kwargs.get("user") or User.from_event(event)
            if not user:
                return unauthorized("Unauthorized access.")

            user_perm_set: set[str] = set(user.permissions)

            if not required_perm_values.issubset(user_perm_set):
                return forbidden("Insufficient permissions.")

            return func(event, context, *args, **kwargs)

        return wrapper

    return decorator


def require_roles(required_roles: set[Role]) -> Callable:
    """Require that the user has one of the specified roles."""
    allowed_roles: set[str] = {role.value for role in required_roles}

    def decorator(func) -> Callable:
        @wraps(func)
        def wrapper(event, context, *args, **kwargs) -> Any:
            user: User | None = kwargs.get("user") or User.from_event(event)
            if not user:
                return unauthorized("Unauthorized access.")

            if user.role not in allowed_roles:
                return forbidden(f"Role '{user.role.value}' not allowed.")

            return func(event, context, *args, **kwargs)

        return wrapper

    return decorator


def require_role_categories(required_categories: set[RoleCategory]) -> Callable:
    """Require that the user has one of the specified role categories."""
    allowed_categories: set[str] = {cat.value for cat in required_categories}

    def decorator(func) -> Callable:
        @wraps(func)
        def wrapper(event, context, *args, **kwargs) -> Any:
            user: User | None = kwargs.get("user") or User.from_event(event)

            if not user:
                return unauthorized("Unauthorized access.")

            if user.role_category not in allowed_categories:
                return forbidden(
                    f"Role category '{user.role_category.value}' not allowed."
                )

            return func(event, context, *args, **kwargs)

        return wrapper

    return decorator


def inject_user() -> Callable:
    def decorator(func) -> Callable:
        @wraps(func)
        def wrapper(event, context, *args, **kwargs) -> Any:

            user: User | None = User.from_event(event)
            if not user:
                logger.warning("[AUTH] No user extracted from event")
                return unauthorized("Unauthorized access.")
            logger.info("USER ROLE: %s", user.role)
            logger.info("USER CATEGORY: %s", user.role_category)
            logger.info("USER PERMS: %s", user.permissions)
            if not user:
                return unauthorized("Unauthorized access.")
            kwargs["user"] = user
            return func(event, context, *args, **kwargs)

        return wrapper

    return decorator


def has_access_to_user(
    target_user_id: str,
    user: User,
    required_permission: Permission,
    allow_self_access: bool = True,
) -> tuple[bool, dict | None]:
    """
    Check whether the authenticated user can access a target user's resources,
    given a specific required permission.

    Args:
        target_user_id (str): The ID of the user being accessed.
        user (User): The authenticated user.
        required_permission (Permission): The permission required to access another
        user's resources.
        allow_self_access (bool): If True, users can access their own data regardless
        of permission.

    Returns:
        Tuple[bool, Optional[dict]]: (True, None) if allowed; (False, error_response)
        otherwise.
    """
    if allow_self_access and target_user_id == user.sub:
        return True, None

    user_permissions: set[str] = set(user.permissions)

    if required_permission.value in user_permissions or user.role == Role.ADMIN:
        return True, None

    return False, forbidden("Insufficient permissions to access this resource.")
