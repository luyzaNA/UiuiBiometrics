from src.utils.generic_router import Router

from src.http_handlers.payment.create_checkout_session import handler as create_payment_handler
from src.http_handlers.payment.webhook import handler as webhook_handler

router = Router(base_path="/api")

ROUTES = [
    ("POST", "payment/create-checkout-session", create_payment_handler),
    ("POST", "webhook", webhook_handler),
]

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context):
    return router.dispatch(event, context)