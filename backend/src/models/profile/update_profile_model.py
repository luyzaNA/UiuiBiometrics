from typing import Optional
from pydantic import BaseModel, Field
from src.models.fields import timestamp_field
from src.utils.enums import Gender

class ProfileUpdateModel(BaseModel):
    """Internal model for updating a Profile in DynamoDB."""

    pk: str = Field(description="Format: USER#<profile_id>")
    sk: str = Field(default="PROFILE#METADATA")

    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[Gender] = Field(default=None)
    updated_at: int = timestamp_field()

    def to_expression_values(self) -> dict:
        """Converts model to ExpressionAttributeValues, filtering out None values."""
        values = {":updated_at": self.updated_at}
        if self.age is not None:
            values[":age"] = self.age
        if self.gender is not None:
            values[":gender"] = self.gender.value
        return values