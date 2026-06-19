import json
import traceback
from functools import wraps

ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
}

def cors(func):
    """
    Bulletproof CORS decorator that catches internal errors
    and guarantees headers are always returned to the browser.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        if len(args) > 1 and isinstance(args[1], dict):
            event = args[1]
        else:
            event = args[0] if isinstance(args[0], dict) else {}

        headers = event.get("headers", {}) or {}
        origin = headers.get("origin") or headers.get("Origin", "")

        if origin.startswith("http://localhost:") or origin in ALLOWED_ORIGINS:
            effective_origin = origin
        else:
            effective_origin = "http://localhost:3000"

        cors_headers = {
            "Access-Control-Allow-Origin": effective_origin,
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        }

        try:
            response = func(*args, **kwargs)
            if not isinstance(response, dict):
                response = {"statusCode": 200, "body": json.dumps(response)}
        except Exception as e:
            print(f"[CORS Decorator] Internal Exception Caught: {str(e)}")
            traceback.print_exc()
            response = {
                "statusCode": 500,
                "body": json.dumps({
                    "message": "Internal Server Error caught by CORS wrapper.",
                    "error": str(e)
                })
            }

        if "headers" not in response:
            response["headers"] = {}

        response["headers"].update(cors_headers)
        return response

    return wrapper