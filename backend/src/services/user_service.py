from datetime import datetime

from repositories.user_repository import UserRepository

class UserService:
    def __init__(self):
        self.repo = UserRepository()

    def sync_user_profile(self, user_id, email, age, sex):
        profile_data = {
            'email': email,
            'age': int(age) if age else None,
            'sex': sex,
            'updatedAt': datetime.utcnow().isoformat()
        }

        return self.repo.save_profile(user_id, profile_data)