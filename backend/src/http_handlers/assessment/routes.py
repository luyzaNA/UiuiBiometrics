"""Entry point for the Assessment Monolith Lambda Router."""

from src.http_handlers.assessment.create_assessment import handler as create_assessment_handler
from src.http_handlers.assessment.get_all_assessments import handler as get_assessments_handler
from src.http_handlers.assessment.get_pending_doctor_assesments import handler as get_pending_assessments_handler
from src.http_handlers.assessment.send_assesment_to_doctor import handler as send_to_doctor_handler

from src.utils.generic_router import Router

ROUTES = [
    ("POST", "assessments", create_assessment_handler),
    ("GET", "assessments", get_assessments_handler),
    ("GET", "assessments/doctor-reviews", get_pending_assessments_handler),
    ("PUT", "assessments/{assessmentId}/send-to-doctor", send_to_doctor_handler)
]

router = Router(base_path="/api")

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context):
    return router.dispatch(event, context)