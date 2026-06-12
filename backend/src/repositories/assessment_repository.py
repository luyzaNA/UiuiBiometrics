"""Assessment repository."""

import json
from decimal import Decimal
from uuid import UUID

from boto3.dynamodb.conditions import Key, Attr

from src.http_handlers.exceptions import NotFoundException
from src.models.assessment.assessment_model import AssessmentModel, DoctorDetails
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
        dynamodb_item = json.loads(
            assessment.model_dump_json(exclude_none=True),
            parse_float=Decimal
        )

        dynamodb_item[self.pk_key] = f"USER#{assessment.cognito_sub}"
        dynamodb_item[self.sk_key] = f"ASSESS#{assessment.assessment_id}"

        self.table.put_item(Item=dynamodb_item)
        return assessment

    def get_by_id(self, cognito_sub: str, assessment_id: str) -> AssessmentModel:
        pk = f"USER#{cognito_sub}"
        sk = f"ASSESS#{assessment_id}"

        response = self.table.get_item(Key={self.pk_key: pk, self.sk_key: sk})
        item = response.get("Item")

        if not item:
            raise NotFoundException(f"Assessment with ID {assessment_id} not found")

        return self.convert_to_assessment_model(item)

    def convert_to_assessment_model(self, item: dict) -> AssessmentModel:

        raw_symptoms = item.get("symptoms", {})
        symptoms = {k: float(v) for k, v in raw_symptoms.items()}

        raw_predictions = item.get("predicted_deficiencies", {})
        predictions = {k: float(v) for k, v in raw_predictions.items()}

        raw_doctor = item.get("doctor_details")
        doctor_obj = None

        if raw_doctor:
            doctor_obj = DoctorDetails(
                doctor_id=raw_doctor.get("doctor_id"),
                name=raw_doctor.get("name"),
                price=float(raw_doctor.get("price", 0.0)),
                bio=raw_doctor.get("bio"),

                # IMPORTANT:
                avatar_key=raw_doctor.get("avatar_key"),
                avatar_url=None  # NU din DB
            )

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
            doctor_details=doctor_obj,
            doctor_notes=item.get("doctor_notes"),
            payment_reference=item.get("payment_reference"),
            next_review_days=item.get("next_review_days"),
            gsi2_pk=item.get("gsi2_pk"),
            gsi2_sk=item.get("gsi2_sk"),
        )

    def get_all_by_user(self, cognito_sub: str):
        pk = f"USER#{cognito_sub}"

        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(pk)
                                   & Key(self.sk_key).begins_with("ASSESS#")
        )

        return [
            self.convert_to_assessment_model(i)
            for i in response.get("Items", [])
        ]

    def get_by_target_person(self, cognito_sub: str, target_person: str):
        pk = f"USER#{cognito_sub}"

        response = self.table.query(
            KeyConditionExpression=Key(self.pk_key).eq(pk)
                                   & Key(self.sk_key).begins_with("ASSESS#"),
            FilterExpression=Attr("target_person").eq(target_person)
        )

        return [
            self.convert_to_assessment_model(i)
            for i in response.get("Items", [])
        ]

    def assign_to_doctor(
            self,
            cognito_sub: str,
            assessment_id: str,
            doctor_details: DoctorDetails,
            new_status: str,
            updated_at: int,
            created_at: int
    ):

        status_value = new_status.value if hasattr(new_status, "value") else new_status

        gsi2_pk = f"DOCTOR#{doctor_details.doctor_id}"
        gsi2_sk = f"STATUS#{status_value}#{created_at}"

        doctor_dict = doctor_details.model_dump()
        doctor_dict["avatar_url"] = None

        if doctor_dict.get("price"):
            doctor_dict["price"] = Decimal(str(doctor_dict["price"]))

        response = self.table.update_item(
            Key={
                "PK": f"USER#{cognito_sub}",
                "SK": f"ASSESS#{assessment_id}"
            },
            UpdateExpression=(
                "SET #status = :status, "
                "updated_at = :updated_at, "
                "doctor_details = :doctor_details, "
                "gsi2_pk = :gsi2_pk, "
                "gsi2_sk = :gsi2_sk"
            ),
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": status_value,
                ":updated_at": updated_at,
                ":doctor_details": doctor_dict,
                ":gsi2_pk": gsi2_pk,
                ":gsi2_sk": gsi2_sk
            },
            ReturnValues="ALL_NEW"
        )

        attrs = response.get("Attributes", {})

        attrs[self.pk_key] = f"USER#{cognito_sub}"
        attrs[self.sk_key] = f"ASSESS#{assessment_id}"
        attrs["cognito_sub"] = cognito_sub
        attrs["assessment_id"] = str(assessment_id)

        return self.convert_to_assessment_model(attrs)