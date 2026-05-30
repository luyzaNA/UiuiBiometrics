from src.http_handlers.vision.analyze_image import handler as analyze_image_handler
from src.utils.generic_router import Router

ROUTES = [
    ("POST", "analyze", analyze_image_handler)
]

router = Router(base_path="/api")

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context):
    return router.dispatch(event, context)