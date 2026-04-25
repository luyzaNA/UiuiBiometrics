import boto3
from chalice import Chalice

app = Chalice(app_name='backend')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('TestTableUiui')

@app.route('/save', methods=['POST'], cors=True)
def save_data():
    received_data = app.current_request.json_body

    table.put_item(
        Item={
            'id': received_data['id'],
            'name': received_data['name'],
            'message': 'Hey from Serverless!'
        }
    )

    return {'status': 'Success!', 'id_saved': received_data['id']}