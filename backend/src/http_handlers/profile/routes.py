"""Entry point for the Profile Monolith Lambda."""

from src.http_handlers.profile.create_profile import handler as create_profile_handler
from src.http_handlers.profile.get_profile_by_cognito_id import handler as get_me_handler
from src.http_handlers.profile.update_profile import handler as update_profile_handler
from src.utils.generic_router import Router

ROUTES = [
    ("GET", "profile/me", get_me_handler),
    ("POST", "profile", create_profile_handler),
    ("PATCH", "profile/{id}", update_profile_handler),
]

router = Router(base_path="/api")

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context):
    return router.dispatch(event, context)