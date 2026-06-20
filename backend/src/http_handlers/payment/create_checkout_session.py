import os
import json
import stripe

from src.auth.auth import inject_user, require_roles
from src.models.user import User
from src.utils.enums import Role
from src.utils.logger import get_logger

stripe_key = os.environ.get('STRIPE_SECRET_KEY')
client = stripe.StripeClient(stripe_key)
logger = get_logger(__name__)

@inject_user()
@require_roles({Role.USER})
def handler(event, context, user: User):
    try:
        body = json.loads(event.get('body', '{}'))
        assessment_id = body.get('assessmentId')
        doctor_id = body.get('doctorId')

        base_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

        success_url = f"{base_url}/doctors?assessmentId={assessment_id}&success=true"
        cancel_url = f"{base_url}/doctors?assessmentId={assessment_id}&canceled=true"
        checkout_session = client.v1.checkout.sessions.create(params={
            'line_items': [
                {
                    'price': 'price_1TjMfQ54eqSWoA4izY4Sjl8Y',
                    'quantity': 1,
                },
            ],
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'metadata': {
                'assessment_id': assessment_id,
                'user_sub': user.sub,
                'doctor_id': doctor_id
            }
        })
        logger.info("[CREATE_CHECKOUT_SESSION]: %s", event)

        return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": True,
                },
                "body": json.dumps({
                    "url": checkout_session.url
                })
            }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": str(e)
            })
        }
