"""Common HTTP utilities for the API."""

import json
from decimal import Decimal
from typing import Any, Union
from uuid import UUID

from pydantic import BaseModel, HttpUrl, ValidationError
from pydantic.alias_generators import to_camel


def default_serializer(obj: Any):
    """Default serializer for JSON serialization."""
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, HttpUrl):
        return str(obj)
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 else float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")


def keys_to_camel_case(obj: Any) -> Any:
    """Converts all dictionary keys in a nested object to camelCase."""
    if isinstance(obj, list):
        return [keys_to_camel_case(item) for item in obj]

    if isinstance(obj, dict):
        return {to_camel(k): keys_to_camel_case(v) for k, v in obj.items()}

    return obj


def response(status_code: int, body: Any) -> dict:
    """Constructs a response object with the given status code and body."""
    if isinstance(body, BaseModel):
        body = body.model_dump()
    elif isinstance(body, list) and all(isinstance(item, BaseModel) for item in body):
        body = [item.model_dump() for item in body]

    body = keys_to_camel_case(body)

    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=default_serializer),
    }


def unauthorized(message="Unauthorized"):
    """Constructs a response object with the given status code and body."""
    return response(401, {"error": message})


def forbidden(message="Forbidden"):
    """Constructs a response object with the given status code and body."""
    return response(403, {"error": message})


def not_found(message="Not Found"):
    """Constructs a 404 Not Found response object with the given message."""
    return response(404, {"error": message})


def format_pydantic_error(err: dict) -> dict:
    """Formats a Pydantic validation error into a more readable format."""
    msg = err["msg"]
    if err.get("type") == "string_pattern_mismatch":
        msg = "Invalid format"
    return {"field": ".".join(str(loc) for loc in err["loc"]), "message": msg}


def bad_request(error: Union[str, list[dict], ValidationError] = "Bad request"):
    """Constructs a 400 Bad Request response object with the given error."""

    if isinstance(error, ValidationError):
        formatted_errors = [format_pydantic_error(dict(err)) for err in error.errors()]
        body = {"error": formatted_errors}
    elif isinstance(error, list):
        body = {"error": error}
    else:
        body = {"error": [{"message": error}]}

    return {
        "statusCode": 400,
        "body": json.dumps(body),
        "headers": {"Content-Type": "application/json"},
    }


def ok(data):
    """Constructs a response object with the given status code and body."""
    return response(200, data)


def internal_server_error(message: str = "Internal Server Error"):
    """Constructs a 500 Internal Server Error response object with the given error."""
    return response(500, {"error": message})
