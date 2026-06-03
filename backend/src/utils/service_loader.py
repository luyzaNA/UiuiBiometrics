"""
File name: service_loader.py
"""

from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from src.services.profile_service import ProfileService
    from src.services.food_menu_service import FoodMenuService

_profile_service: Optional["ProfileService"] = None
_food_menu_service: Optional["FoodMenuService"] = None


def get_profile_service() -> "ProfileService":
    global _profile_service
    if _profile_service is None:
        from src.services.profile_service import ProfileService

        _profile_service = ProfileService()
    return _profile_service


def get_food_menu_service() -> "FoodMenuService":
    global _food_menu_service
    if _food_menu_service is None:
        from src.services.food_menu_service import FoodMenuService

        _food_menu_service = FoodMenuService()
    return _food_menu_service
