from pydantic import BaseModel, Field
from typing import Literal

class UpdateUserRoleRequest(BaseModel):
    """Payload for adding or removing a user from a group."""

    group_name: Literal["admin", "doctor"] = Field( description="The name of the Cognito group.")
    action: Literal["add", "remove"] = Field(description="Action to perform: add to group or remove from group.")