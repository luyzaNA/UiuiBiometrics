import os
import stripe
import base64

from src.http_handlers.common import ok, bad_request
from src.models.assessment.assessment_model import DoctorDetails
from src.services.assessment_service import AssessmentService
from src.services.doctor_service import DoctorService

assessment_service = AssessmentService()
doctor_service = DoctorService()

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

def handler(event, context):
    payload = event.get("body", "")

    if event.get("isBase64Encoded"):
        payload = base64.b64decode(payload).decode("utf-8")

    headers = event.get("headers", {})
    signature = headers.get("stripe-signature") or headers.get("Stripe-Signature")

    if not signature:
        return ok("Missing signature")

    try:
        stripe_event = stripe.Webhook.construct_event(
            payload,
            signature,
            os.environ["STRIPE_WEBHOOK_SECRET"]
        )
    except stripe.error.SignatureVerificationError:
        return {"statusCode": 400, "body": "Invalid payload"}
    except ValueError:
        return {"statusCode": 400, "body": "Invalid payload"}

    if stripe_event["type"] != "checkout.session.completed":
        return ok("success")

    session = stripe_event["data"]["object"]

    assessment_id = session["metadata"]["assessment_id"]
    user_sub = session["metadata"]["user_sub"]
    doctor_id = session["metadata"]["doctor_id"]

    doctor = doctor_service.get_doctor_by_sub(doctor_id)
    if not doctor:
        return bad_request("Doctor not found")

    doctor_details = DoctorDetails(
        doctor_id=doctor_id,
        full_name=doctor.full_name,
        bio=doctor.bio,
        avatar_key=getattr(doctor, "avatar_key", None),
        avatar_url=None
    )

    assessment_service.fulfill_assessment_payment(
        cognito_sub=user_sub,
        assessment_id=assessment_id,
        payment_reference=session["payment_intent"],
        doctor_details=doctor_details
    )

    return ok("success")