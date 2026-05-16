from functools import wraps

ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
}
def cors(func):
    """
    CORS decorator that handles being called from a class
    or as a standalone function.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        if len(args) > 1 and isinstance(args[1], dict):
            event = args[1]
        else:
            event = args[0] if isinstance(args[0], dict) else {}

        headers = event.get("headers", {})
        origin = headers.get("origin") or headers.get("Origin", "")

        if origin.startswith("http://localhost:") or origin in ALLOWED_ORIGINS:
            effective_origin = origin
        else:
            effective_origin = "http://localhost:3000"

        response = func(*args, **kwargs)

        if isinstance(response, dict):
            if "headers" not in response:
                response["headers"] = {}

            response["headers"].update({
                "Access-Control-Allow-Origin": effective_origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            })

        return response

    return wrapper