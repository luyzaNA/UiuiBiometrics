from src.http_handlers.food_menu.create_food_menu import handler as create_food_menu_handler
from src.http_handlers.food_menu.get_active_food_menu import handler as get_active_menu_handler
from src.http_handlers.food_menu.get_food_menu_history import handler as get_menu_history_handler
from src.http_handlers.food_menu.activate_food_menu import (handler as activate_food_menu_handler)
from src.utils.generic_router import Router

ROUTES = [
    ("POST", "menu/food", create_food_menu_handler),
    ("GET", "menu/food/active", get_active_menu_handler),
    ("GET", "menu/food/history", get_menu_history_handler),
    ("PATCH", "menu/food/activate", activate_food_menu_handler)
]

router = Router(base_path="/api")

for method, path, handler in ROUTES:
    router.add(method, path, handler)

def handler(event, context):
    return router.dispatch(event, context)