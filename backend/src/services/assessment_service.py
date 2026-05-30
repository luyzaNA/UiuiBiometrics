"""Assessment Service."""

from uuid import uuid4

from src.http_handlers.assessment_request import CreateAssessmentRequest
from src.models.assessment.assessment_model import AssessmentModel
from src.repositories.assessment_repository import AssessmentRepository
from src.utils.calculate_wellness_score import calculate_wellness_score
from src.utils.deficiencies_detection import detect_deficiencies
from src.utils.enums import AssessmentStatus
from src.utils.time import current_millis
from src.utils.logger import get_logger
from src.utils.clinical_rules import evaluate_medical_red_flags, evaluate_multi_deficiency_alerts

logger = get_logger(__name__)

class AssessmentService:
    """
    Assessment Service

    Orchestrates the digital medical evaluation process:
    Runs the ML model, checks clinical rules, and saves everything to DynamoDB.
    """

    def __init__(self):
        self.assessment_repository = AssessmentRepository()
    def create_assessment(self, request: CreateAssessmentRequest, cognito_sub: str) -> AssessmentModel:
        current_date: int = current_millis()

        computed_wellness_score = calculate_wellness_score(request.symptoms)

        symptom_red_flags = evaluate_medical_red_flags(request.symptoms)

        if symptom_red_flags:
            logger.warning(f"[TRIAGE] Detected red flag.")

            early_assessment = AssessmentModel(
                pk=f"USER#{cognito_sub}",
                sk="PENDING",
                assessment_id=uuid4(),
                cognito_sub=cognito_sub,
                target_person=request.target_person,
                age=request.age,
                gender=request.gender,
                symptoms=request.symptoms,
                predicted_deficiencies={},
                wellness_score=0,
                status=AssessmentStatus.RED_FLAG_TRIGGERED,
                has_red_flags=True,
                red_flag_details=symptom_red_flags,
                created_at=current_date,
                updated_at=current_date
            )
            early_assessment.sk = f"ASSESS#{early_assessment.assessment_id}"
            return self.assessment_repository.create_assessment(early_assessment)

        predictions = detect_deficiencies(
            age=request.age,
            gender=request.gender,
            user_symptoms=request.symptoms
        )

        systemic_red_flags = evaluate_multi_deficiency_alerts(predictions)
        has_alerts = len(systemic_red_flags) > 0
        status_flux = AssessmentStatus.RED_FLAG_TRIGGERED if has_alerts else AssessmentStatus.PENDING

        new_assessment = AssessmentModel(
            pk=f"USER#{cognito_sub}",
            sk="PENDING",
            assessment_id=uuid4(),
            cognito_sub=cognito_sub,
            target_person=request.target_person,
            age=request.age,
            gender=request.gender,
            symptoms=request.symptoms,
            predicted_deficiencies=predictions,
            wellness_score=computed_wellness_score,
            status=status_flux,
            has_red_flags=has_alerts,
            red_flag_details=systemic_red_flags,
            created_at=current_date,
            updated_at=current_date
        )

        new_assessment.sk = f"ASSESS#{new_assessment.assessment_id}"
        return self.assessment_repository.create_assessment(new_assessment)

    def get_assessment_by_id(self, assessment_id: str, cognito_sub: str) -> AssessmentModel:
        return self.assessment_repository.get_by_id(cognito_sub=cognito_sub, assessment_id=assessment_id)

    def get_user_assessments(self, cognito_sub: str) -> list[AssessmentModel]:
        """
        Retrieve the complete history of assessments for a given user.
        """
        return self.assessment_repository.get_all_by_user(cognito_sub=cognito_sub)