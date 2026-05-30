"""Entry point for the Assessment Monolith Lambda Router."""

from src.http_handlers.assessment.create_assessment import handler as create_assessment_handler
from src.http_handlers.assessment.get_all_assessments import handler as get_assessments_handler

from src.utils.generic_router import Router

ROUTES = [
    ("POST", "assessments", create_assessment_handler),
    ("GET", "assessments", get_assessments_handler)
]

router = Router(base_path="/api")

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context):
    return router.dispatch(event, context)