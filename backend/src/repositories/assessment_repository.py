"""Assessment repository."""

import json
from decimal import Decimal
from uuid import UUID

from boto3.dynamodb.conditions import Key, Attr

from src.http_handlers.exceptions import NotFoundException
from src.models.assessment.assessment_model import AssessmentModel
from src.repositories.base_repository import BaseRepository
from src.utils.enums import Gender, AssessmentStatus
from src.utils.settings import UIUI_BIOMETRICS_TABLE


class AssessmentRepository(BaseRepository):
    """Repository for managing health assessments and ML predictions."""

    def __init__(self) -> None:
        table_name: str | None = UIUI_BIOMETRICS_TABLE

        if not table_name:
            raise ValueError("UIUI_BIOMETRICS_TABLE environment variable is not set")

        self._table_name = table_name
        super().__init__()

    def create_assessment(self, assessment: AssessmentModel) -> AssessmentModel:
        """
        Save a new assessment and its ML predictions into DynamoDB safely.
        Uses JSON serialization to guarantee zero precision loss for ML floats.
        """

        dynamodb_item = json.loads(assessment.model_dump_json(exclude_none=True), parse_float=Decimal)

        dynamodb_item[self.pk_key] = f"USER#{assessment.cognito_sub}"
        dynamodb_item[self.sk_key] = f"ASSESS#{assessment.assessment_id}"

        self.table.put_item(Item=dynamodb_item)

        return assessment

    def get_by_id(self, cognito_sub: str, assessment_id: str) -> AssessmentModel:
        """
        Fetch a specific assessment for a user.
        """
        pk = f"USER#{cognito_sub}"
        sk = f"ASSESS#{assessment_id}"

        response = self.table.get_item(Key={self.pk_key: pk, self.sk_key: sk})
        item = response.get("Item")

        if not item:
            raise NotFoundException(f"Assessment with ID {assessment_id} not found")

        return self.convert_to_assessment_model(item)


    def convert_to_assessment_model(self, item: dict) -> AssessmentModel:
        """Convert DynamoDB dict back to AssessmentModel Pydantic object."""

        raw_symptoms = item.get("symptoms", {})
        symptoms = {k: float(v) for k, v in raw_symptoms.items()}

        raw_predictions = item.get("predicted_deficiencies", {})
        predictions = {k: float(v) for k, v in raw_predictions.items()}

        return AssessmentModel(
            pk=item.get(self.pk_key),
            sk=item.get(self.sk_key),
            assessment_id=UUID(item.get("assessment_id")),
            cognito_sub=item.get("cognito_sub"),
            target_person=item.get("target_person", "Principal"),
            age=int(item.get("age")),
            gender=Gender(item.get("gender")),
            symptoms=symptoms,
            predicted_deficiencies=predictions,

            image_keys=item.get("image_keys", []),
            image_urls=item.get("image_urls", []),

            wellness_score=float(item.get("wellness_score", 100.0)),

            status=item.get("status", AssessmentStatus.PENDING),
            has_red_flags=bool(item.get("has_red_flags", False)),
            red_flag_details=item.get("red_flag_details", []),
            created_at=int(item.get("created_at", 0)),
            updated_at=int(item.get("updated_at", 0)),

            doctor_id=item.get("doctor_id"),
            doctor_notes=item.get("doctor_notes"),
            payment_reference=item.get("payment_reference"),
            next_review_days=int(item.get("next_review_days")) if item.get("next_review_days") is not None else None,
            gsi2_pk=item.get("gsi2_pk"),
            gsi2_sk=item.get("gsi2_sk")
        )

    def get_all_by_user(self, cognito_sub: str) -> list[AssessmentModel]:
        """
        Fetch ALL assessments for a specific user.
        """
        pk = f"USER#{cognito_sub}"

        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(pk) & Key(self.sk_key).begins_with("ASSESS#")
        )

        items = response.get("Items", [])

        return [self.convert_to_assessment_model(item) for item in items]

    def get_by_target_person(self, cognito_sub: str, target_person: str) -> list[AssessmentModel]:
        pk = f"USER#{cognito_sub}"

        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(pk) & Key(self.sk_key).begins_with("ASSESS#"),
            FilterExpression=Attr("target_person").eq(target_person)
        )

        return [self.convert_to_assessment_model(item) for item in response.get("Items", [])]

    def assign_to_doctor(
            self,
            cognito_sub: str,
            assessment_id: str,
            doctor_id: str,
            new_status: str,
            updated_at: int
    ) -> AssessmentModel:


        if not cognito_sub or not assessment_id:
            raise ValueError("Both cognito_sub and assessment_id are required to update an item.")

        response = self.table.update_item(
            Key={
                "PK": f"USER#{cognito_sub}",
                "SK": f"ASSESS#{assessment_id}"
            },
            UpdateExpression="SET #status = :status, updated_at = :updated_at, doctor_id = :doctor_id",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": new_status,
                ":updated_at": updated_at,
                ":doctor_id": doctor_id
            },
            ReturnValues="ALL_NEW"
        )

        attributes = response.get("Attributes", {})

        if "PK" in attributes:
            attributes["pk"] = attributes.pop("PK")
        if "SK" in attributes:
            attributes["sk"] = attributes.pop("SK")

        return AssessmentModel(**attributes)