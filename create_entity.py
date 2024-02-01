import requests
import csv
import json
from uuid import uuid4

def send_sett_data_to_odk(sett_array):
    # Construct the request body as a dictionary
    request_body = {
        'email': 'kisip.mis@gmail.com',
        'password': 'Admin@2011'
    }

    # Initialize the token variable
    token = None

    # Login and get a token
    login_response = requests.post(
        'https://collector.kesmis.go.ke/v1/sessions',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(request_body)
    )

    if login_response.status_code == 200:
        # Parse the JSON response
        response_body = login_response.json()
        # Extract the token from the response
        token = response_body.get('token')

        endpoint_url = 'https://collector.kesmis.go.ke/v1/projects/4/datasets/settlements/entities'
        bearer_token = token

        try:
            for sett in sett_array:
                sett_obj = {
                    'uuid': str(uuid4()),
                    'label': sett['label'],
                    'data': {
                        'county_name': sett['county_name'],  # Assuming 'county_name' is present in the CSV
                        'sett_name': sett['label'],
                        'code': sett['code'],
                    }
                }

                # Send a POST request to the endpoint with sett_obj as the request body
                response = requests.post(
                    endpoint_url,
                    headers={
                        'Authorization': f'Bearer {bearer_token}',
                        'Content-Type': 'application/json',
                    },
                    data=json.dumps(sett_obj)
                )

                if response.status_code == 200:
                    print(f'Successfully sent data: {json.dumps(sett_obj)}')
                else:
                    print(f'Failed to send data: {json.dumps(sett_obj)}')
                    print(f'Response status code: {response.status_code}')
                    print(f'Response content: {response.text}')
        except Exception as e:
            print(f'Error: {e}')
    else:
        # Handle errors here
        print(f'Error: {login_response.text}')

def read_settlement_data_from_csv(csv_file_path):
    sett_array = []
    with open(csv_file_path, 'r') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        for row in csv_reader:
            sett_array.append(row)
    return sett_array

# Example usage:
# Replace 'your_csv_file.csv' with the actual CSV file path containing settlement data
csv_file_path = 'settlements.csv'
sett_array_from_csv = read_settlement_data_from_csv(csv_file_path)
send_sett_data_to_odk(sett_array_from_csv)
