from src.services.menu_service import MenuService
from src.utils.logger import get_logger

logger = get_logger(__name__)

def handler(event, context):
    """
    Cron handler to process expired nutritional menus and mark them for review.
    Invoked via EventBridge rule (e.g., daily at 00:00).
    """
    try:
        logger.info("[CRON_EXPIRED_MENUS] Starting automated review process...")

        menu_service = MenuService()
        count = menu_service.process_expired_menus()

        logger.info(f"[CRON_EXPIRED_MENUS] Successfully processed {count} expired menus.")
        return {"status": "success", "processed": count}

    except Exception as e:
        logger.exception("[CRON_EXPIRED_MENUS] Failed to run expired menus batch job.")
        raise e