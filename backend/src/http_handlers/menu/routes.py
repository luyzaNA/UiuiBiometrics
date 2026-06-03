from src.http_handlers.menu.create_food_base_menu import handler as create_food_menu_handler
from src.http_handlers.menu.create_meal_based_menu import create_meal_menu_handler
from src.http_handlers.menu.generate_partial_meal import generate_partial_meal_handler
from src.http_handlers.menu.get_active_menu import handler as get_active_menu_handler
from src.http_handlers.menu.get_menu_history import handler as get_menu_history_handler
from src.http_handlers.menu.activate_menu import handler as activate_menu_handler

from src.utils.generic_router import Router

ROUTES = [
    ("POST", "menu/food", create_food_menu_handler),
    ("POST", "menu/meals/generate", generate_partial_meal_handler),
    ("POST", "menu/meals", create_meal_menu_handler),
    ("GET", "menu/active/{target_person}", get_active_menu_handler),
    ("GET", "menu/history", get_menu_history_handler),
    ("PATCH", "menu/activate", activate_menu_handler)
]

router = Router(base_path="/api")

for method, path, handler_func in ROUTES:
    router.add(method, path, handler_func)

def handler(event, context):
    """
    Main Lambda entry point.
    Dispatches the incoming API Gateway event to the matched route handler.
    """
    return router.dispatch(event, context)