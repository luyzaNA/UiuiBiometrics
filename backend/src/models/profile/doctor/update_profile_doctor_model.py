from typing import Optional
from pydantic import BaseModel, Field
from src.models.fields import timestamp_field
from src.utils.enums import Gender

class ProfileUpdateModel(BaseModel):
    """Internal model for updating a Profile in DynamoDB."""

    pk: str = Field(description="Format: USER#<cognito_sub>")
    sk: str = Field(default="PROFILE#METADATA")

    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[Gender] = Field(default=None)
    full_name: Optional[str] = Field(default=None, description="Doctor's full name")
    updated_at: int = timestamp_field()
    avatar_url: Optional[str] = Field(default=None)
    avatar_key: Optional[str] = Field(default=None, description="S3 key for the avatar image")

    def to_expression_values(self) -> dict:
        """Converts model to ExpressionAttributeValues, filtering out None values."""
        values = {":updated_at": self.updated_at}
        if self.age is not None:
            values[":age"] = self.age
        if self.gender is not None:
            values[":gender"] = self.gender.value
        if self.full_name is not None:
            values[":full_name"] = self.full_name
        if self.avatar_url is not None:
            values[":avatar_url"] = self.avatar_url
        if self.avatar_key is not None:
            values[":avatar_key"] = self.avatar_key
        return values