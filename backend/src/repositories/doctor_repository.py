"""Doctor repository."""

import json
from decimal import Decimal
from typing import List
from uuid import UUID

from boto3.dynamodb.conditions import Key

from src.http_handlers.exceptions import NotFoundException
from src.models.profile.doctor.profile_doctor_model import DoctorProfileModel
from src.repositories.base_repository import BaseRepository
from src.utils.enums import Gender
from src.utils.settings import UIUI_BIOMETRICS_TABLE
from src.models.profile.doctor.review_model import ReviewModel

class DoctorRepository(BaseRepository):
    """Repository for managing doctor profiles."""

    def __init__(self) -> None:
        table_name: str | None = UIUI_BIOMETRICS_TABLE

        if not table_name:
            raise ValueError("UIUI_BIOMETRICS_TABLE environment variable is not set")

        self._table_name = table_name
        super().__init__()

    def create_profile(self, profile: DoctorProfileModel) -> DoctorProfileModel:
        """
        Save a doctor profile into DynamoDB safely.
        Uses JSON serialization to preserve numeric precision.
        """

        item = json.loads(
            profile.model_dump_json(exclude_none=True),
            parse_float=Decimal
        )

        item[self.pk_key] = f"DOCTOR#{profile.cognito_sub}"
        item[self.sk_key] = "PROFILE#METADATA"

        item["GSI2_PK"] = "SYSTEM#DOCTORS"
        item["GSI2_SK"] = "PROFILE#METADATA"

        self.table.put_item(Item=item)

        return profile

    def get_by_cognito_sub(self, sub: str) -> DoctorProfileModel:
        """
        Fetch a doctor profile by Cognito sub.
        """
        pk = f"DOCTOR#{sub}"
        sk = "PROFILE#METADATA"

        response = self.table.get_item(
            Key={
                self.pk_key: pk,
                self.sk_key: sk
            }
        )

        item = response.get("Item")

        if not item:
            raise NotFoundException(
                f"Doctor profile for sub {sub} not found"
            )

        return self.convert_to_doctor_profile_model(item)

    def get_all_doctors(self) -> List[DoctorProfileModel]:
        """
        Fetch all doctor profiles using GSI2.
        """
        response = self.table.query(
            IndexName="GSI2",
            KeyConditionExpression="GSI2_PK = :GSI2_PK AND GSI2_SK = :GSI2_SK",
            ExpressionAttributeValues={
                ":GSI2_PK": "SYSTEM#DOCTORS",
                ":GSI2_SK": "PROFILE#METADATA"
            }
        )

        items = response.get("Items", [])

        return [
            self.convert_to_doctor_profile_model(item)
            for item in items
        ]

    def update_profile_fields(
            self,
            sub: str,
            updated_at: int,
            age=None,
            full_name=None,
            gender=None,
            bio=None,
            avatar_key=None,
            avatar_url=None,
            price=None
    ) -> DoctorProfileModel:
        """
        Update doctor profile fields dynamically.
        """
        update_parts = ["updated_at = :updated_at"]
        values = {
            ":updated_at": updated_at
        }

        if age is not None:
            update_parts.append("age = :age")
            values[":age"] = age

        if gender is not None:
            update_parts.append("gender = :gender")
            values[":gender"] = gender.value

        if full_name is not None:
            update_parts.append("full_name = :full_name_val")
            values[":full_name_val"] = full_name

        if bio is not None:
            update_parts.append("bio = :bio")
            values[":bio"] = bio

        if price is not None:
            update_parts.append("price = :price")
            values[":price"] = price

        if avatar_key is not None:
            update_parts.append("avatar_key = :avatar_key")
            values[":avatar_key"] = avatar_key

        if avatar_url is not None:
            update_parts.append("avatar_url = :avatar_url")
            values[":avatar_url"] = avatar_url

        update_kwargs = {
            "Key": {
                self.pk_key: f"DOCTOR#{sub}",
                self.sk_key: "PROFILE#METADATA"
            },
            "UpdateExpression": f"SET {', '.join(update_parts)}",
            "ExpressionAttributeValues": values,
            "ConditionExpression": f"attribute_exists({self.pk_key})",
            "ReturnValues": "ALL_NEW"
        }

        response = self.table.update_item(**update_kwargs)

        return self.convert_to_doctor_profile_model(
            response["Attributes"]
        )

    def convert_to_doctor_profile_model(
            self,
            item: dict
    ) -> DoctorProfileModel:
        """
        Convert DynamoDB item to DoctorProfileModel.
        """
        return DoctorProfileModel(
            pk=item.get(self.pk_key),
            sk=item.get(self.sk_key),

            profile_id=UUID(item["profile_id"]),
            cognito_sub=item["cognito_sub"],

            age=int(item["age"]),
            gender=Gender(item["gender"]),
            full_name=item.get("full_name", ""),

            avatar_url=item.get("avatar_url", ""),
            avatar_key=item.get("avatar_key"),

            bio=item.get("bio"),

            price=int(item.get("price", 0)),
            average_rating=float(item.get("average_rating", 0.0)),
            total_reviews=int(item.get("total_reviews", 0))
        )

    def add_review_and_update_stats(self, doctor_sub: str, review: ReviewModel, new_avg: float, new_total: int):
        review_item = review.model_dump(exclude_none=True)
        review_item[self.pk_key] = f"DOCTOR#{doctor_sub}"
        review_item[self.sk_key] = f"REVIEW#{review.created_at}#{review.reviewer_sub}"

        self.table.put_item(Item=review_item)

        self.table.update_item(
            Key={
                self.pk_key: f"DOCTOR#{doctor_sub}",
                self.sk_key: "PROFILE#METADATA"
            },
            UpdateExpression="SET average_rating = :avg, total_reviews = :total",
            ExpressionAttributeValues={
                ":avg": Decimal(str(new_avg)),
                ":total": new_total
            }
        )

    def get_doctor_with_reviews(self, doctor_sub: str) -> dict:
        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(f"DOCTOR#{doctor_sub}")
        )

        items = response.get("Items", [])
        profile_item = None
        reviews = []

        for item in items:
            if item.get(self.sk_key) == "PROFILE#METADATA":
                profile_item = item
            elif str(item.get(self.sk_key)).startswith("REVIEW#"):
                reviews.append(item)

        if not profile_item:
            raise NotFoundException(f"Doctor profile for sub {doctor_sub} not found")

        reviews.sort(key=lambda x: x.get("created_at", 0), reverse=True)

        doctor_model = self.convert_to_doctor_profile_model(profile_item)

        return {
            "profile": doctor_model,
            "reviews": [ReviewModel(**r) for r in reviews]
        }