"""Entry point for the Admin Monolith Lambda Router."""

from src.http_handlers.admin.admin_list_users import list_cognito_users_handler
from src.http_handlers.admin.get_user_counts import get_user_counts_handler
from src.http_handlers.admin.update_user import update_user_role_handler
from src.utils.generic_router import Router

ROUTES = [
    ("GET", "admin/users", list_cognito_users_handler),
    ("GET", "admin/users/stats", get_user_counts_handler),
    ("POST", "admin/users/{username}/roles", update_user_role_handler),
]

router = Router(base_path="/api")

for method, path, handler_func in ROUTES:
    router.add(method, path, handler_func)

def handler(event, context):
    return router.dispatch(event, context)