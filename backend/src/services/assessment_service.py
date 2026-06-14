"""Assessment Service."""

import base64
import os
import uuid
from uuid import uuid4
import boto3
import json
from openai import OpenAI
from botocore.exceptions import ClientError

from src.http_handlers.assessment_request import CreateAssessmentRequest
from src.models.assessment.assessment_model import AssessmentModel, DoctorDetails
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
        return s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": AVATAR_BUCKET, "Key": key},
            ExpiresIn=3600
        )
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

        assessment.image_urls = [
            get_signed_url_from_s3(key)
            for key in assessment.image_keys if key
        ]

        return assessment

    def get_user_assessments(self, cognito_sub: str, target_person: str = None) -> list[AssessmentModel]:
        if target_person:
            assessments = self.assessment_repository.get_by_target_person(
                cognito_sub=cognito_sub,
                target_person=target_person
            )
        else:
            assessments = self.assessment_repository.get_all_by_user(cognito_sub=cognito_sub)

        for assessment in assessments:
            assessment.image_urls = [
                get_signed_url_from_s3(key)
                for key in assessment.image_keys if key
            ]

        return assessments

    def send_to_doctor(
            self,
            cognito_sub: str,
            assessment_id: str,
            doctor_details: DoctorDetails | None = None
    ) -> AssessmentModel:

        current_date = current_millis()

        return self.assessment_repository.assign_to_doctor(
            cognito_sub=cognito_sub,
            assessment_id=assessment_id,
            doctor_details=doctor_details,
            new_status=AssessmentStatus.PENDING_DOCTOR,
            updated_at=current_date,
            created_at=current_date
        )

    def get_history_by_target_person(self, cognito_sub: str, target_person: str) -> list[AssessmentModel]:
        """
        Retrieves the assessment history for a specific target person and generates presigned S3 URLs.
        """
        logger.info(f"[ASSESSMENT_SERVICE] Fetching history for user {cognito_sub} and target {target_person}")

        assessments = self.assessment_repository.get_history_by_target_person(
            cognito_sub=cognito_sub,
            target_person=target_person
        )

        for assessment in assessments:
            assessment.image_urls = [get_signed_url_from_s3(key) for key in assessment.image_keys if key]

            if assessment.doctor_details and assessment.doctor_details.avatar_key:
                assessment.doctor_details.avatar_url = get_signed_url_from_s3(assessment.doctor_details.avatar_key)

        return assessments

    def get_unique_patients_by_doctor(self, doctor_id: str) -> list[dict]:
        """
        Returns unique patients with latest assessment + full_name from profile table.
        """
        assessments = self.assessment_repository.get_assessments_by_doctor(doctor_id)
        unique_patients = {}

        for item in assessments:
            patient_key = (item.cognito_sub, item.target_person)

            if (
                    patient_key not in unique_patients
                    or item.created_at > unique_patients[patient_key]["lastAssessmentAt"]
            ):
                unique_patients[patient_key] = {
                    "cognitoSub": item.cognito_sub,
                    "targetPerson": item.target_person,
                    "age": item.age,
                    "gender": item.gender.value if hasattr(item.gender, "value") else item.gender,
                    "lastAssessmentAt": item.created_at,
                    "latestStatus": item.status.value if hasattr(item.status, "value") else item.status,
                    "latestAssessmentId": str(item.assessment_id),
                }

        for patient in unique_patients.values():
            sub = patient["cognitoSub"]

            try:
                response = self.assessment_repository.table.get_item(
                    Key={
                        "PK": f"USER#{sub}",
                        "SK": "PROFILE#METADATA"
                    }
                )

                profile_item = response.get("Item", {})

                patient["fullName"] = profile_item.get("full_name", "")

            except Exception as e:
                logger.warning(f"[PATIENTS] Failed profile fetch for {sub}: {e}")
                patient["fullName"] = ""

        return sorted(
            unique_patients.values(),
            key=lambda x: x["lastAssessmentAt"],
            reverse=True
        )

    def get_number_of_patients(self, doctor_id: str) -> dict:
        """
        Fetches all assessments for a doctor and calculates total unique patients
        and active patients in the last 30 days.
        """
        from src.utils.time import current_millis

        assessments = self.assessment_repository.get_assessments_by_doctor(doctor_id)

        thirty_days_ago = current_millis() - (30 * 24 * 60 * 60 * 1000)

        total_unique_patients = set()
        active_last_month = set()

        for item in assessments:
            patient_key = (item.cognito_sub, item.target_person)
            total_unique_patients.add(patient_key)

            if item.created_at >= thirty_days_ago:
                active_last_month.add(patient_key)

        return {
            "total": len(total_unique_patients),
            "lastMonth": len(active_last_month)
        }

    def get_pending_assessments(self, doctor_id: str) -> list[AssessmentModel]:
        """
        Fetches the list of assessments waiting for the doctor's review and enriches S3 image URLs.
        """
        assessments = self.assessment_repository.get_pending_assessments_by_doctor(doctor_id)

        for assessment in assessments:
            assessment.image_urls = [
                get_signed_url_from_s3(key)
                for key in assessment.image_keys if key
            ]

        return assessments

    def update_doctor_notes(self, cognito_sub: str, assessment_id: str, doctor_notes: str) -> AssessmentModel:
        """
        Adds doctor notes to an assessment and transitions its status to DOCTOR_REVIEWED.
        """
        assessment = self.assessment_repository.get_by_id(cognito_sub, assessment_id)

        if not assessment.doctor_details or not assessment.doctor_details.doctor_id:
            raise ValueError("Assessment is not assigned to any doctor.")

        current_time = current_millis()
        new_status = AssessmentStatus.DOCTOR_REVIEWED

        status_val = new_status.value if hasattr(new_status, "value") else new_status
        new_gsi2_sk = f"STATUS#{status_val}#{assessment.created_at}"

        return self.assessment_repository.update_assessment_notes_and_status(
            cognito_sub=cognito_sub,
            assessment_id=assessment_id,
            doctor_notes=doctor_notes,
            new_status=new_status,
            updated_at=current_time,
            gsi2_sk=new_gsi2_sk
        )

    def get_reviewed_assessments_stats(self, doctor_id: str) -> dict:
        """
        Fetches all DOCTOR_REVIEWED assessments for a doctor and calculates
        the total count and the count from the last 7 days.
        """
        from src.utils.time import current_millis

        assessments = self.assessment_repository.get_reviewed_assessments_by_doctor(doctor_id)

        seven_days_ago = current_millis() - (7 * 24 * 60 * 60 * 1000)

        total_reviewed = len(assessments)

        reviewed_last_week = sum(1 for item in assessments if item.updated_at >= seven_days_ago)

        return {
            "totalReviewed": total_reviewed,
            "reviewedLastWeek": reviewed_last_week
        }

    def get_user_assessments_by_status(self, cognito_sub: str, status: str, target_person: str = None) -> list[AssessmentModel]:
        """
        Retrieves user assessments filtered by status, and optionally by target_person.
        Generates S3 presigned URLs for the images.
        """
        if target_person:
            assessments = self.assessment_repository.get_by_target_person_and_status(
                cognito_sub=cognito_sub,
                target_person=target_person,
                status=status
            )
        else:
            assessments = self.assessment_repository.get_all_by_user_and_status(
                cognito_sub=cognito_sub,
                status=status
            )

        for assessment in assessments:
            assessment.image_urls = [
                get_signed_url_from_s3(key)
                for key in assessment.image_keys if key
            ]

        return assessments

    def count_pending_assessments(self, doctor_id: str) -> dict:
        """
        Fetches the total number of pending assessments for a specific doctor.
        """
        logger.info(f"[ASSESSMENT_SERVICE] Counting pending assessments for doctor {doctor_id}")

        count = self.assessment_repository.count_pending_assessments_by_doctor(doctor_id)

        return { "pendingCount": count}

    def generate_patient_history_summary(self, cognito_sub: str, target_person: str) -> dict:
        """
        Fetches the complete clinical history of a patient, processes it,
        and generates a structured medical summary using GPT-4o.
        Includes a synthesis of previous physician notes and recommendations.
        """
        api_key = os.environ.get("VISION_API_KEY")
        if not api_key:
            raise ValueError("VISION_API_KEY missing in environment variables.")

        client = OpenAI(
            api_key=api_key,
            base_url="https://llm.wavespeed.ai/v1"
        )

        assessments = self.get_history_by_target_person(
            cognito_sub=cognito_sub,
            target_person=target_person
        )

        if not assessments:
            return {
                "success": False,
                "message": f"No assessment history found for patient: {target_person}"
            }

        latest_assessment = assessments[0]

        patient_metadata = {
            "name/target": target_person,
            "age": latest_assessment.age,
            "gender": (
                latest_assessment.gender.value
                if hasattr(latest_assessment.gender, "value")
                else latest_assessment.gender
            )
        }

        history_payload = []
        doctor_notes_history = []

        for record in assessments:
            history_payload.append({
                "date_timestamp": record.created_at,
                "status": (
                    record.status.value
                    if hasattr(record.status, "value")
                    else record.status
                ),
                "symptoms_reported": record.symptoms,
                "detected_deficiencies": record.predicted_deficiencies,
                "wellness_score": record.wellness_score,
                "doctor_notes_past": getattr(record, "doctor_notes", None)
            })

            if getattr(record, "doctor_notes", None):
                doctor_notes_history.append({
                    "date_timestamp": record.created_at,
                    "doctor_notes": record.doctor_notes
                })

        prompt = f"""
    You are an expert clinical AI assistant specializing in internal medicine and functional nutrition.
    
    PATIENT PROFILE
    {json.dumps(patient_metadata, indent=2)}
    
    HISTORICAL DATA TIMELINE (Ordered from newest to oldest)
    {json.dumps(history_payload, indent=2)}
    
    PREVIOUS PHYSICIAN NOTES
    {json.dumps(doctor_notes_history, indent=2)}
    
    TASK
    
    Analyze the complete patient history and generate a clinically useful summary for the attending physician.
    
    You must analyze:
    
    1. Symptom evolution across all assessments.
    2. Nutritional deficiency trends over time.
    3. Wellness score progression.
    4. Historical physician observations and recommendations.
    5. Consistency between physician opinions and objective assessment findings.
    
    SPECIAL INSTRUCTIONS ABOUT PHYSICIAN NOTES
    
    If physician notes exist:
    
    - Summarize the key medical observations made by previous physicians.
    - Identify recurring concerns mentioned across multiple assessments.
    - Detect recurring recommendations or treatment directions.
    - Highlight any documented improvements or deteriorations.
    - Extract clinical patterns that physicians repeatedly noticed.
    - Do NOT copy physician notes verbatim.
    - Create a concise medical synthesis suitable for another physician reviewing the case.
    - Mention areas where physician observations align with symptom and deficiency trends.
    
    CRITICAL INSTRUCTIONS
    
    * Return ONLY valid JSON matching the schema below.
    * Do not include markdown.
    * Do not include explanations outside JSON.
    * All patient-facing or physician-facing text must be available in BOTH English ("en") and Romanian ("ro").
    * Keep summaries concise but clinically meaningful.
    * Base conclusions only on the supplied historical data.
    
    JSON SCHEMA
    
    {{
      "clinical_overview": {{
        "en": "Brief high-level summary of the current clinical state.",
        "ro": "Rezumat scurt, la nivel înalt, al stării clinice actuale."
      }},
      "symptom_evolution": {{
        "en": "Analysis of how symptoms changed, improved, or worsened over time.",
        "ro": "Analiza modului în care simptomele s-au schimbat, îmbunătățit sau înrăutățit în timp."
      }},
      "deficiency_trends": {{
        "en": "Identification of persistent, resolving, or newly appearing nutritional deficiencies.",
        "ro": "Identificarea deficiențelor nutriționale persistente, în curs de rezolvare sau nou apărute."
      }},
      "physician_consensus": {{
        "en": "Summary of historical physician observations, conclusions and recurring recommendations.",
        "ro": "Rezumat al observațiilor medicilor, concluziilor și recomandărilor recurente din istoricul pacientului."
      }},
      "clinical_recommendations": [
        {{
          "en": "Actionable focus area for the doctor during next consultation.",
          "ro": "Zonă de acțiune recomandată pentru medic la următoarea consultație."
        }}
      ]
    }}
    """

        try:
            logger.info(
                f"[ASSESSMENT_SERVICE] Generating history summary for {target_person}..."
            )

            response = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=2500,
                temperature=0.3
            )

            ai_response_text = response.choices[0].message.content.strip()

            if ai_response_text.startswith("```json"):
                ai_response_text = ai_response_text[7:-3].strip()
            elif ai_response_text.startswith("```"):
                ai_response_text = ai_response_text[3:-3].strip()

            return json.loads(ai_response_text)

        except json.JSONDecodeError as je:
            logger.error(
                f"[ASSESSMENT_SERVICE] JSON Decode Error on summary generation: {str(je)}"
            )
            raise je

        except Exception as e:
            logger.error(
                f"[ASSESSMENT_SERVICE] Exception during AI history summary generation: {str(e)}"
            )
            raise e