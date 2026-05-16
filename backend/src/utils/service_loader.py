"""
File name: service_loader.py
"""

from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from src.services.profile_service import ProfileService

_profile_service: Optional["ProfileService"] = None

def get_profile_service() -> "ProfileService":
    global _profile_service
    if _profile_service is None:
        from src.services.profile_service import ProfileService

        _profile_service = ProfileService()
    return _profile_service
