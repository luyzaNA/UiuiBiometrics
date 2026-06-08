from enum import Enum

class Role(str, Enum):
    """Roles matching Cognito Groups."""
    ADMIN = "admin"
    USER = "user"
    DOCTOR = "doctor"


class RoleCategory(str, Enum):
    """Categories for broad permission grouping."""
    ADMIN = "admin"
    USER = "user"
    DOCTOR = "doctor"


class Permission(str, Enum):
    """Specific feature permissions."""
    PROFILE_CREATE = "profile:create"
    PROFILE_VIEW = "profile:view"

    DOCTOR_PROFILE_CREATE = "doctor_profile:create"
    DOCTOR_PROFILE_UPDATE = "doctor_profile:update"
    DOCTOR_LIST_VIEW = "doctor:list"
    PATIENT_LIST_VIEW = "patients:list"

    DOCTOR_REVIEW_CREATE = "doctor_review:create"

    HEALTH_LOG_CREATE = "health_log:create"
    HEALTH_LOG_VIEW = "health_log:view"

    DIET_VIEW = "diet:view"
    DIET_GENERATE = "diet:generate"

ALLOWED_PERMISSIONS = {p.value for p in Permission}

class Gender(str, Enum):
    """Gender options for assessments."""
    FEMININE = "feminine"
    MASCULINE = "masculine"


class AssessmentStatus(str, Enum):
    """Represents the operational status of an assessment flow."""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    RED_FLAG_TRIGGERED = "RED_FLAG_TRIGGERED"
    PENDING_DOCTOR = "PENDING_DOCTOR"
    DOCTOR_REVIEWED = "DOCTOR_REVIEWED"

class MenuType(str, Enum):
    FOOD_ITEMS = "FOOD_ITEMS"
    MEALS = "MEALS"

class MenuStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    COMPLETED = "COMPLETED"