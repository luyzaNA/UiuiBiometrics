from src.http_handlers.doctor.create_doctor_profile import handler as create_doctor_handler
from src.http_handlers.doctor.get_doctor_profile import handler as get_doctor_handler
from src.http_handlers.doctor.get_all_doctors import handler as get_all_doctors_handler
from src.http_handlers.doctor.update_doctor_profile import handler as update_doctor_handler
from src.utils.generic_router import Router

ROUTES = [
    ("GET", "doctor", get_all_doctors_handler),
    ("GET", "doctor/profile/me", get_doctor_handler),
    ("POST", "doctor/profile", create_doctor_handler),
    ("PUT", "doctor/profile", update_doctor_handler),
]

router = Router(base_path="/api")

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context ):
    return router.dispatch(event, context)