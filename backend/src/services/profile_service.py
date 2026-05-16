"""Profile Service"""

from uuid import UUID, uuid4
from src.http_handlers.profile_requests import CreateProfileRequest

from src.models.profile.profile_model import ProfileModel
from src.repositories.profile_repository import ProfileRepository
from src.utils.time import current_millis

from src.http_handlers.profile_requests import UpdateProfileRequest
from src.models.profile.update_profile_model import ProfileUpdateModel


class ProfileService:
    """
    Profile Service

    Handles business logic for user profiles, including linking Cognito
    identities and preparing demographic data for the ML model.
    """

    def __init__(self):
        self.profile_repository = ProfileRepository()

    def create_profile(self, request: CreateProfileRequest, cognito_sub: str) -> ProfileModel:
        """
        Create a new user profile after the initial quiz.

        Parameters:
            request (CreateProfileRequest): Contains age and gender.
            cognito_sub (str): The unique ID from AWS Cognito.

        Returns:
            ProfileModel: The newly created profile.
        """
        profile_id: UUID = uuid4()
        current_date: int = current_millis()

        new_profile = ProfileModel(
            pk=f"USER#{profile_id}",
            sk="PROFILE#METADATA",
            gsi1_pk=f"COGNITO#{cognito_sub}",
            gsi1_sk="PROFILE",
            profile_id=profile_id,
            cognito_sub=cognito_sub,
            age=request.age,
            gender=request.gender,
            created_at=current_date,
            updated_at=current_date
        )

        return self.profile_repository.create_profile(new_profile)

    def get_profile_by_sub(self, cognito_sub: str) -> ProfileModel:
        """
        Retrieve a profile based on the Cognito Sub.
        Used during login to check if the user is already onboarded.

        Parameters:
            cognito_sub (str): The sub from the auth token.

        Returns:
            ProfileModel: The user profile.
        """
        return self.profile_repository.get_by_cognito_sub(sub=cognito_sub)

    def get_profile_by_id(self, profile_id: UUID) -> ProfileModel:
        """
        Retrieve a profile by its internal UUID.

        Parameters:
            profile_id (UUID): The internal profile ID.

        Returns:
            ProfileModel: The user profile.
        """
        return self.profile_repository.get_by_id(profile_id=profile_id)

    def update_profile(
            self, profile_id: UUID, request: UpdateProfileRequest
    ) -> ProfileModel:
        """Handles business logic for updating a user profile."""

        current_date: int = current_millis()

        update_model = ProfileUpdateModel(
            pk=f"USER#{profile_id}",
            age=request.age,
            gender=request.gender,
            updated_at=current_date,
        )

        return self.profile_repository.update(update_model)