"""DynamoDB resource singleton"""

from boto3 import resource
from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource

from src.utils.settings import IS_OFFLINE

_DB_RESOURCE_INSTANCE: DynamoDBServiceResource | None = None

def get_dynamodb_client() -> DynamoDBServiceResource:
    """Get DynamoDB resource (singleton pattern)"""
    global _DB_RESOURCE_INSTANCE

    if _DB_RESOURCE_INSTANCE is None:
        if IS_OFFLINE:
            _DB_RESOURCE_INSTANCE = resource(
                "dynamodb",
                region_name="localhost",
                endpoint_url="http://localhost:8011",
                aws_access_key_id="xxxx",
                aws_secret_access_key="xxxx",
            )
        else:
            _DB_RESOURCE_INSTANCE = resource("dynamodb")

    return _DB_RESOURCE_INSTANCE
