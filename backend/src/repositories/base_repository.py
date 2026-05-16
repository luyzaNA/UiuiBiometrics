"""Base repository"""

from boto3 import resource
from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource
from mypy_boto3_dynamodb.service_resource import Table as DynamoTable

from src.utils.dynamo_db import get_dynamodb_client

dynamo_db: DynamoDBServiceResource = resource("dynamodb")


class BaseRepository:
    """Base repository"""

    _table_name: str
    _table: DynamoTable
    pk_key: str
    sk_key: str

    def __init__(self) -> None:
        table_name: None | str = getattr(self, "_table_name", None)

        if table_name is None:
            raise ValueError("Table name not defined - provide it in subclass")

        self._table_name = table_name
        self._table = get_dynamodb_client().Table(table_name)

        self.pk_key = "PK"
        self.sk_key = "SK"

    @property
    def table_name(self) -> str:
        """Getter for table name."""
        return self._table_name

    @property
    def table(self) -> DynamoTable:
        """Getter for table."""
        return self._table
