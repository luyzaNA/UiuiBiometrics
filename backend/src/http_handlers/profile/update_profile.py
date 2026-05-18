import traceback
from json import loads
from uuid import UUID
from src.auth.auth import inject_user, require_roles
from src.http_handlers.exceptions import NotFoundException
from src.http_handlers.profile_requests import UpdateProfileRequest
from src.models.user import User
from src.utils.enums import Role
from src.http_handlers.common import ok, bad_request, internal_server_error, not_found
from src.utils.service_loader import get_profile_service

from src.utils.logger import get_logger

logger = get_logger(__name__)

@inject_user()
@require_roles({Role.USER, Role.ADMIN})
def handler(event, context, user: User):
    try:
        profile_id = event.get("pathParameters", {}).get("id")
        if not profile_id:
            return bad_request("Missing profile id.")

        data = loads(event.get("body") or "{}")
        update_req = UpdateProfileRequest(**data)

        logger.info(f"Updating profile {profile_id} for user {user.sub} with data: {update_req}")

        updated_profile = get_profile_service().update_profile(
            profile_id=UUID(profile_id),
            request=update_req,
            cognito_sub = user.sub
        )
        updated_profile.avatar_url = get_profile_service().get_signed_url_from_s3(updated_profile.avatar_key)

        return ok(data=updated_profile.model_dump(exclude={"pk", "sk", "gsi1_pk", "gsi1_sk"}))

    except NotFoundException:
        return not_found("Profile not found.")
    except Exception as e:
        logger.error(e)
        return internal_server_error()