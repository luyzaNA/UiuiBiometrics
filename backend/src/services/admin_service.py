import os
import json
import boto3
from botocore.exceptions import ClientError
from src.utils.logger import get_logger

logger = get_logger(__name__)

class CognitoAdminService:
    """Service for Admin operations directly on AWS Cognito."""

    def __init__(self):
        self.region = os.environ.get("AWS_REGION", "eu-north-1")
        self.user_pool_id = os.environ.get("USER_POOL_ID", "eu-north-1_aBOOx7l1A")

        if os.environ.get("IS_OFFLINE") == "true":
            pass

        self.client = boto3.client("cognito-idp", region_name=self.region)

    def list_users(self, limit: int = 50, pagination_token: str = None) -> dict:
        """Fetch users from Cognito User Pool and their assigned groups."""
        try:
            params = {
                "UserPoolId": self.user_pool_id,
                "Limit": limit
            }
            if pagination_token:
                params["PaginationToken"] = pagination_token

            response = self.client.list_users(**params)

            formatted_users = []
            for user in response.get("Users", []):
                username = user["Username"]
                attributes = {attr["Name"]: attr["Value"] for attr in user.get("Attributes", [])}

                provider = "Email/Password"
                identities_str = attributes.get("identities")

                if identities_str:
                    try:
                        identities = json.loads(identities_str)
                        if identities and len(identities) > 0:
                            provider = identities[0].get("providerName")
                    except Exception:
                        pass
                elif user.get("UserStatus") == "EXTERNAL_PROVIDER":
                    if username.startswith("google"):
                        provider = "Google"
                    elif username.startswith("facebook"):
                        provider = "Facebook"
                    else:
                        provider = "Social Login"

                roles = []
                try:
                    groups_response = self.client.admin_list_groups_for_user(
                        UserPoolId=self.user_pool_id,
                        Username=username
                    )

                    for group in groups_response.get("Groups", []):
                        group_name = group.get("GroupName")
                        if not group_name.startswith(self.region):
                            roles.append(group_name.upper())

                except ClientError as e:
                    logger.warning("Failed to fetch groups for user %s: %s", username, e)

                if not roles:
                    roles = ["USER"]

                formatted_users.append({
                    "username": username,
                    "email": attributes.get("email"),
                    "status": user.get("UserStatus"),
                    "enabled": user.get("Enabled"),
                    "created_at": user.get("UserCreateDate").isoformat() if user.get("UserCreateDate") else None,
                    "provider": provider,
                    "roles": roles
                })

            return {
                "users": formatted_users,
                "pagination_token": response.get("PaginationToken")
            }

        except ClientError as e:
            logger.exception("Error fetching users from Cognito: %s", e)
            raise

    def assign_user_to_group(self, username: str, group_name: str):
        """Add a user to a specific Cognito Group (e.g., 'doctor' or 'admin')."""
        try:
            self.client.admin_add_user_to_group(
                UserPoolId=self.user_pool_id,
                Username=username,
                GroupName=group_name
            )
            return True
        except ClientError as e:
            logger.exception(f"Failed to add user {username} to group {group_name}: {e}")
            raise

    def remove_user_from_group(self, username: str, group_name: str):
        """Remove a user from a specific Cognito Group."""
        try:
            self.client.admin_remove_user_from_group(
                UserPoolId=self.user_pool_id,
                Username=username,
                GroupName=group_name
            )
            return True
        except ClientError as e:
            logger.exception(f"Failed to remove user {username} from group {group_name}: {e}")
            raise

    def get_user_counts(self) -> dict:
        """
        Get the total number of users and the number of users in the 'doctor' group.
        Returns both statistics in a single call.
        """
        try:
            pool_info = self.client.describe_user_pool(UserPoolId=self.user_pool_id)
            total_users = pool_info.get("UserPool", {}).get("EstimatedNumberOfUsers", 0)

            doctor_count = 0
            pagination_token = None

            while True:
                params = {
                    "UserPoolId": self.user_pool_id,
                    "GroupName": "doctor",
                    "Limit": 60
                }
                if pagination_token:
                    params["PaginationToken"] = pagination_token

                group_response = self.client.list_users_in_group(**params)
                doctor_count += len(group_response.get("Users", []))

                pagination_token = group_response.get("PaginationToken")
                if not pagination_token:
                    break

            return {
                "total_users": total_users,
                "doctor_users": doctor_count
            }

        except ClientError as e:
            logger.exception("Error calculating user and doctor counts: %s", e)
            raise