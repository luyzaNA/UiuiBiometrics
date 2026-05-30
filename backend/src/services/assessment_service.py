"""Assessment Service."""

import base64
import os
import uuid
from uuid import uuid4
import boto3
from botocore.exceptions import ClientError

from src.http_handlers.assessment_request import CreateAssessmentRequest
from src.models.assessment.assessment_model import AssessmentModel
from src.repositories.assessment_repository import AssessmentRepository
from src.utils.calculate_wellness_score import calculate_wellness_score
from src.utils.deficiencies_detection import detect_deficiencies
from src.utils.enums import AssessmentStatus
from src.utils.time import current_millis
from src.utils.logger import get_logger
from src.utils.clinical_rules import evaluate_medical_red_flags, evaluate_multi_deficiency_alerts
from src.utils.settings import AVATAR_BUCKET

logger = get_logger(__name__)

if os.environ.get("IS_OFFLINE") == "true":
    s3 = boto3.client(
        "s3",
        endpoint_url="http://localhost:4569",
        aws_access_key_id="S3RVER",
        aws_secret_access_key="S3RVER",
        region_name="eu-north-1"
    )
else:
    s3 = boto3.client("s3", region_name="eu-north-1")

def upload_assessment_image(image_data: str, cognito_sub: str, assessment_id: str) -> str | None:
    if not image_data or not image_data.startswith("data:image"):
        return None

    if not AVATAR_BUCKET:
        logger.error("[UPLOAD_IMAGE] BUCKET environment variable is not set.")
        return None

    try:
        header, base64_data = image_data.split(",", 1)
        content_type = header.split(";")[0].split(":")[1]
        ext = content_type.split("/")[1]
        if ext == "jpeg":
            ext = "jpg"

        key = f"assessments/{cognito_sub}/{assessment_id}/{uuid.uuid4()}.{ext}"
        image_bytes = base64.b64decode(base64_data)

        s3.put_object(
            Bucket=AVATAR_BUCKET,
            Key=key,
            Body=image_bytes,
            ContentType=content_type
        )
        return key
    except Exception as e:
        logger.exception(f"Error uploading assessment image to S3: {e}")
        return None

def get_signed_url_from_s3(key: str | None) -> str | None:
    if not key:
        return None
    try:
        url: str = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": AVATAR_BUCKET, "Key": key},
            ExpiresIn=3600
        )
        return url
    except ClientError:
        logger.exception("Error generating signed URL")
        return None

class AssessmentService:
    def __init__(self):
        self.assessment_repository = AssessmentRepository()

    def create_assessment(self, request: CreateAssessmentRequest, cognito_sub: str) -> AssessmentModel:
        current_date: int = current_millis()

        new_assessment_id = uuid4()

        uploaded_keys = []
        uploaded_urls = []
        if request.images:
            for img_base64 in request.images:
                img_key = upload_assessment_image(img_base64, cognito_sub, str(new_assessment_id))
                if img_key:
                    uploaded_keys.append(img_key)
                    signed_url = get_signed_url_from_s3(img_key)
                    if signed_url:
                        uploaded_urls.append(signed_url)

        computed_wellness_score = calculate_wellness_score(request.symptoms)
        symptom_red_flags = evaluate_medical_red_flags(request.symptoms)

        if symptom_red_flags:
            logger.warning(f"[TRIAGE] Detected red flag.")

            early_assessment = AssessmentModel(
                pk=f"USER#{cognito_sub}",
                sk=f"ASSESS#{new_assessment_id}",
                assessment_id=new_assessment_id,
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
                image_keys=uploaded_keys,
                image_urls=uploaded_urls,
                created_at=current_date,
                updated_at=current_date
            )
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
            sk=f"ASSESS#{new_assessment_id}",
            assessment_id=new_assessment_id,
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
            image_keys=uploaded_keys,
            image_urls=uploaded_urls,
            created_at=current_date,
            updated_at=current_date
        )

        return self.assessment_repository.create_assessment(new_assessment)

    def get_assessment_by_id(self, assessment_id: str, cognito_sub: str) -> AssessmentModel:
        assessment = self.assessment_repository.get_by_id(cognito_sub=cognito_sub, assessment_id=assessment_id)
        assessment.image_urls = [get_signed_url_from_s3(key) for key in assessment.image_keys if key]
        return assessment

    def get_user_assessments(self, cognito_sub: str) -> list[AssessmentModel]:
        assessments = self.assessment_repository.get_all_by_user(cognito_sub=cognito_sub)
        for assessment in assessments:
            assessment.image_urls = [get_signed_url_from_s3(key) for key in assessment.image_keys if key]
        return assessments