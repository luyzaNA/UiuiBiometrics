from enum import Enum


class Role(str, Enum):
    """Roles matching Cognito Groups."""
    ADMIN = "admin"
    USER = "user"


class RoleCategory(str, Enum):
    """Categories for broad permission grouping."""
    ADMIN = "admin"
    USER = "user"


class Permission(str, Enum):
    """Specific feature permissions."""
    PROFILE_CREATE = "profile:create"
    PROFILE_VIEW = "profile:view"

    HEALTH_LOG_CREATE = "health_log:create"
    HEALTH_LOG_VIEW = "health_log:view"

    DIET_VIEW = "diet:view"
    DIET_GENERATE = "diet:generate"

ALLOWED_PERMISSIONS = {p.value for p in Permission}

class Gender(str, Enum):
    FEMININE = "feminine"
    MASCULINE = "masculine"