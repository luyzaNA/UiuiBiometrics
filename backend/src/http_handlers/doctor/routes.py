from src.http_handlers.doctor.create_doctor_profile import handler as create_doctor_handler
from src.http_handlers.doctor.get_doctor_profile import handler as get_doctor_handler
from src.http_handlers.doctor.get_all_doctors import handler as get_all_doctors_handler
from src.http_handlers.doctor.get_doctor_patients import handler as get_doctor_patients_handler
from src.http_handlers.doctor.get_number_of_patients import handler as get_doctor_patients_count_handler
from src.http_handlers.doctor.get_pending_assessments import handler as get_pending_assessments_handler
from src.http_handlers.doctor.update_doctor_profile import handler as update_doctor_handler
from src.http_handlers.doctor.get_doctor_by_id import handler as get_doctor_by_id_handler
from src.http_handlers.doctor.get_number_of_assessments import handler as get_number_of_assessments_handler
from src.http_handlers.doctor.get_number_of_reviewed_assessments import handler as get_reviewed_assessments_handler
from src.http_handlers.doctor.add_review import handler as add_doctor_review_handler
from src.utils.generic_router import Router

ROUTES = [
    ("GET", "doctor", get_all_doctors_handler),
    ("GET", "doctor/profile/me", get_doctor_handler),
    ("GET", "doctor/{doctor_id}",  get_doctor_by_id_handler),
    ("GET", "doctor/patients", get_doctor_patients_handler),
    ("GET", "doctor/patients/count", get_doctor_patients_count_handler),
    ("GET", "doctor/assessments/pending", get_pending_assessments_handler),
    ("GET", "doctor/assessments/reviewed-stats", get_reviewed_assessments_handler),
    ("GET", "doctor/assessments/pending/count", get_number_of_assessments_handler),
    ("POST", "doctor/profile", create_doctor_handler),
    ("POST", "doctor/{doctor_id}/reviews", add_doctor_review_handler),
    ("PUT", "doctor/profile", update_doctor_handler)
]
router = Router(base_path="/api")

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context ):
    return router.dispatch(event, context)