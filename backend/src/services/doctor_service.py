import uuid
from typing import List
from uuid import uuid4

from src.http_handlers.doctor_request import CreateDoctorProfileRequest, UpdateDoctorProfileRequest
from src.models.profile.doctor.profile_doctor_model import DoctorProfileModel
from src.repositories.doctor_repository import DoctorRepository
from src.repositories.profile_repository import ProfileRepository
from src.services.profile_service import upload_avatar_if_exists, get_signed_url_from_s3
from src.utils.time import current_millis
from src.utils.logger import get_logger
from src.http_handlers.doctor_request import CreateDoctorReviewRequest
from src.models.profile.doctor.review_model import ReviewModel
from src.models.user import User

logger = get_logger(__name__)

class DoctorService:
    """
    Doctor Service

    Handles business logic for specialist doctor profiles, reusing core
    S3 storage utilities from the base profile service.
    """

    def __init__(self):
        self.doctor_repository = DoctorRepository()
        self.profile_repository = ProfileRepository()


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
                full_name=request.fullName,
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
        print(request)

        doctor = self.doctor_repository.update_profile_fields(
            sub=cognito_sub,
            age=request.age,
            full_name=request.fullName,
            gender=request.gender,
            bio=request.bio,
            avatar_key=avatar_key,
            avatar_url=avatar_url,
            price=request.price,
            updated_at=current_date
        )
        print(doctor)

        if doctor.avatar_key and not doctor.avatar_url:
            doctor.avatar_url = get_signed_url_from_s3(doctor.avatar_key)

        return doctor

    def add_review(self, doctor_sub: str, reviewer: User, request: CreateDoctorReviewRequest):
        """Calculează noua medie a doctorului și adaugă review-ul cu datele din profil."""
        doctor = self.get_doctor_by_sub(doctor_sub)

        current_total = doctor.total_reviews
        current_avg = doctor.average_rating

        new_total = current_total + 1
        new_avg = ((current_avg * current_total) + request.rating) / new_total

        user_profile = self.profile_repository.get_by_cognito_sub(reviewer.sub)

        if user_profile and user_profile.full_name:
            reviewer_name = user_profile.full_name
        else:
            reviewer_name = f"{reviewer.first_name} {reviewer.last_name}".strip() or "Anonymous"

        review = ReviewModel(
            reviewer_sub=reviewer.sub,
            reviewer_name=reviewer_name,
            rating=request.rating,
            comment=request.comment
        )

        self.doctor_repository.add_review_and_update_stats(doctor_sub, review, round(new_avg, 2), new_total)

        return review

    def get_doctor_profile_with_reviews(self, doctor_sub: str) -> dict:
        """Ia doctorul și review-urile și injectează URL-ul avatarului."""
        data = self.doctor_repository.get_doctor_with_reviews(doctor_sub)

        doctor = data["profile"]
        if doctor.avatar_key:
            doctor.avatar_url = get_signed_url_from_s3(doctor.avatar_key)

        return {
            "profile": doctor.model_dump(exclude={"gsi2_pk", "gsi2_sk", "pk", "sk", "avatar_key"}),
            "reviews": [r.model_dump() for r in data["reviews"]]
        }

