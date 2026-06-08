import uuid
from typing import List
from uuid import uuid4

from src.http_handlers.doctor_request import CreateDoctorProfileRequest, UpdateDoctorProfileRequest
from src.models.profile.doctor.profile_doctor_model import DoctorProfileModel
from src.repositories.doctor_repository import DoctorRepository
from src.services.profile_service import upload_avatar_if_exists, get_signed_url_from_s3
from src.utils.time import current_millis
from src.utils.logger import get_logger

logger = get_logger(__name__)


class DoctorService:
    """
    Doctor Service

    Handles business logic for specialist doctor profiles, reusing core
    S3 storage utilities from the base profile service.
    """

    def __init__(self):
        self.doctor_repository = DoctorRepository()

    def create_profile(self, request: CreateDoctorProfileRequest, cognito_sub: str) -> DoctorProfileModel:
        """Creates a new doctor profile partition using the Cognito sub as PK."""
        current_date: int = current_millis()
        avatar_key = upload_avatar_if_exists(request.avatar, cognito_sub)
        avatar_url = get_signed_url_from_s3(avatar_key) if avatar_key else None

        new_doctor = DoctorProfileModel(
            pk=f"DOCTOR#{cognito_sub}",
            sk="PROFILE#METADATA",
            profile_id=uuid4(),
            cognito_sub=cognito_sub,
            age=request.age,
            name=request.name,
            gender=request.gender,
            bio=request.bio,
            price=request.price,
            avatar_url=avatar_url,
            avatar_key=avatar_key,
            created_at=current_date,
            updated_at=current_date
        )

        return self.doctor_repository.create_profile(new_doctor)

    def get_doctor_by_sub(self, cognito_sub: str) -> DoctorProfileModel:
        """Retrieve a doctor profile based on Cognito Sub and inject dynamic presigned avatar URL."""
        doctor = self.doctor_repository.get_by_cognito_sub(sub=cognito_sub)

        if doctor.avatar_key:
            doctor.avatar_url = get_signed_url_from_s3(doctor.avatar_key)

        return doctor

    def get_all_doctors(self) -> List[DoctorProfileModel]:
        """Retrieve all doctors indexed in GSI2 and dynamically inject presigned avatar URLs."""
        doctors = self.doctor_repository.get_all_doctors()

        for doctor in doctors:
            if doctor.avatar_key:
                doctor.avatar_url = get_signed_url_from_s3(doctor.avatar_key)

        return doctors

    def update_profile(self, request: UpdateDoctorProfileRequest, cognito_sub: str) -> DoctorProfileModel:
        """Handles partial updates for a doctor profile partition."""
        current_date: int = current_millis()
        avatar_key = upload_avatar_if_exists(request.avatar, cognito_sub)
        avatar_url = get_signed_url_from_s3(avatar_key) if avatar_key else None

        doctor = self.doctor_repository.update_profile_fields(
            sub=cognito_sub,
            age=request.age,
            name=request.name,
            gender=request.gender,
            bio=request.bio,
            avatar_key=avatar_key,
            avatar_url=avatar_url,
            price=request.price,
            updated_at=current_date
        )

        if doctor.avatar_key and not doctor.avatar_url:
            doctor.avatar_url = get_signed_url_from_s3(doctor.avatar_key)

        return doctor