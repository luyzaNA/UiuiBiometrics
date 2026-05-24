"""Assessment repository."""

import json
from decimal import Decimal
from uuid import UUID

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
            status=item.get("status", AssessmentStatus.PENDING),
            has_red_flags=bool(item.get("has_red_flags", False)),
            red_flag_details=item.get("red_flag_details", []),
            created_at=int(item.get("created_at", 0)),
            updated_at=int(item.get("updated_at", 0)),
        )