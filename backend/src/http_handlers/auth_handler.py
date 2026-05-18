import json

from src.services.user_service import UserService

user_service = UserService()

def sync_profile(event, context):
    try:
        print(event)
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Success"})
        }
        claims = event['requestContext']['authorizer']['jwt']['claims']
        user_id = claims['sub']
        email = claims.get('email')

        body = json.loads(event.get('body', '{}'))

        success = user_service.sync_user_profile(
            user_id, email, body.get('age'), body.get('sex')
        )

        if not success:
            return {"statusCode": 500, "body": json.dumps({"error": "Failed to save"})}

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Success", "userId": user_id})
        }
    except Exception as e:
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}