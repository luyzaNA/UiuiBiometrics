from src.auth.auth import inject_user, require_roles
from src.http_handlers.common import internal_server_error, ok
from src.models.user import User
from src.utils.constants.models import MODEL_EXCLUDED_KEYS
from src.utils.enums import Role
from src.utils.logger import get_logger
from src.services.doctor_service import DoctorService

logger = get_logger(__name__)


@inject_user()
@require_roles({Role.USER, Role.ADMIN, Role.DOCTOR})
def handler(event, context, user: User):
    """
    Handler to retrieve all specialists registered in the system via GSI2.
    """
    try:
        logger.info("[GET_ALL_DOCTORS] Fetching specialist list for Sub: %s", user.sub)

        doctor_service = DoctorService()
        doctors = doctor_service.get_all_doctors()

        data = [doc.model_dump(exclude=MODEL_EXCLUDED_KEYS) for doc in doctors]
        return ok(data=data)

    except Exception: # pylint: disable=broad-except
        logger.exception("[GET_ALL_DOCTORS] Failed to retrieve doctor list.")
        return internal_server_error()