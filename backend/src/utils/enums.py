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

class NotificationType(str, Enum):
    DOCTOR_PENDING_ASSESSMENT = "DOCTOR_PENDING_ASSESSMENT"
    DOCTOR_NEW_REVIEW = "DOCTOR_NEW_REVIEW"
    PATIENT_DOCTOR_NOTES = "PATIENT_DOCTOR_NOTES"
    RETAKE_QUIZ = "RETAKE_QUIZ"

NOTIFICATION_TEMPLATES = {
    NotificationType.DOCTOR_PENDING_ASSESSMENT: {
        "title": "Pending Assessments",
        "message": "You have new assessments waiting for review.",
        "role": Role.DOCTOR.value
    },
    NotificationType.DOCTOR_NEW_REVIEW: {
        "title": "New Reviews",
        "message": "A patient left you a new review.",
        "role": Role.DOCTOR.value
    },
    NotificationType.PATIENT_DOCTOR_NOTES: {
        "title": "Medical Feedback",
        "message": "Your doctor has reviewed your assessment.",
        "role": Role.USER.value
    },
    NotificationType.RETAKE_QUIZ: {
        "title": "Retake quiz",
        "message": "Your monitoring period has ended. Please retake the assessment to observe your progress.",
        "role": Role.USER.value
    }
}