import os
import boto3
from botocore.exceptions import ClientError

class UserRepository:
    def __init__(self):
        self.table = boto3.resource('dynamodb').Table(os.environ['DYNAMODB_TABLE'])

    def save_profile(self, user_id, profile_data):
        try:
            self.table.put_item(
                Item={
                    'PK': f'USER#{user_id}',
                    'SK': 'PROFILE',
                    **profile_data
                }
            )
            return True
        except ClientError as e:
            print(f"Database Error: {e.response['Error']['Message']}")
            return False