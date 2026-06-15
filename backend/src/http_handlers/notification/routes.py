from src.utils.generic_router import Router

from src.http_handlers.notification.get_all_notifications import handler as get_notifications_handler
from src.http_handlers.notification.mark_notification_as_read import handler as mark_read_handler
from src.http_handlers.notification.mark_all_notifications_as_read import handler as mark_all_handler

router = Router(base_path="/api")

ROUTES = [
    ("GET", "notifications", get_notifications_handler),
    ("PATCH", "notifications/{sk}/read", mark_read_handler),
    ("PATCH", "notifications/read-all", mark_all_handler)
]

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context):
    return router.dispatch(event, context)