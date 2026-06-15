"""
File name: service_loader.py
"""

from typing import Optional, TYPE_CHECKING


if TYPE_CHECKING:
    from src.services.profile_service import ProfileService
    from src.services.menu_service import MenuService
    from src.services.doctor_service import DoctorService
    from src.services.notification_service import NotificationService


_profile_service: Optional["ProfileService"] = None
_food_menu_service: Optional["MenuService"] = None
_doctor_service: Optional["DoctorService"] = None
_notification_service: Optional["NotificationService"] = None


def get_profile_service() -> "ProfileService":
    global _profile_service
    if _profile_service is None:
        from src.services.profile_service import ProfileService

        _profile_service = ProfileService()
    return _profile_service


def get_food_menu_service() -> "MenuService":
    global _food_menu_service
    if _food_menu_service is None:
        from src.services.menu_service import MenuService

        _food_menu_service = MenuService()
    return _food_menu_service

def get_doctor_service() -> "DoctorService":
    global _doctor_service
    if _doctor_service is None:
        from src.services.doctor_service import DoctorService

        _doctor_service = DoctorService()
    return _doctor_service

def get_notification_service() -> "NotificationService":
    global _notification_service
    if _notification_service is None:
        from src.services.notification_service import NotificationService

        _notification_service = NotificationService()
    return _notification_service

