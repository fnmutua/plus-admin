import fiona
import json
import requests
from fuzzywuzzy import process
from pyproj import Transformer

def login_and_get_token(auth_url, username, password):
    """
    Log in to the authentication endpoint and retrieve the access token.
    """
    credentials = {'username': username, 'password': password}
    response = requests.post(auth_url, json=credentials)
    
    if response.status_code == 200:
        #print(response.json())
        token = response.json().get('accessToken')
        if token:
            print("Login successful, token acquired.")
            return token
        else:
            print("No token found in response.")
            return None
    else:
        print("Login failed:", response.status_code, response.text)
        return None

def fetch_expected_fields(endpoint_url, token):
    """
    Fetch expected fields from the endpoint using the access token.
    Assumes the endpoint returns a JSON list of field names.
    """
    headers = {'x-access-token': f'{token}'}
    data_payload = {
    "model": "parcel" 
    }
    
    #response = requests.get(endpoint_url, headers=headers)
    response = requests.post(endpoint_url, headers=headers, json=data_payload)
    
    if response.status_code == 200:
        #print(response.json())
        fields_list = [item['field'] for item in response.json()['data'] if item['field'] != 'id']

        #print(fields_list)
        return fields_list
    else:
        print("Failed to fetch expected fields:", response.status_code, response.text)
        return []

def match_fields(gdb_fields, expected_fields):
    """
    Match GDB fields to expected fields using fuzzy matching.
    Returns a dictionary mapping expected fields to GDB fields.
    """
    matched_fields = {}
    for expected_field in expected_fields:
        best_match, score = process.extractOne(expected_field, gdb_fields)
        print(best_match, score,expected_field)
        if score > 80:  # Adjust threshold as needed
            matched_fields[expected_field] = best_match
    return matched_fields

def xread_and_match_gdb_to_json(gdb_path, matched_fields, layer_name=None):
    """
    Reads a GDB, extracts and matches fields, and returns JSON data for a specific layer or all layers.
    
    :param gdb_path: Path to the Geodatabase (GDB)
    :param matched_fields: Dictionary mapping expected fields to GDB fields
    :param layer_name: Optional specific layer name to process. If None, processes all layers.
    :return: JSON string containing matched features
    """
    all_features = {}

    with fiona.Env():
        # If a specific layer is provided, process only that layer
        layers_to_process = [layer_name] if layer_name else fiona.listlayers(gdb_path)
        
        # Loop through each specified layer
        for layer in layers_to_process:
            with fiona.open(gdb_path, layer=layer) as layer_data:
                features = []
                for feature in layer_data:
                    matched_feature = {}
                    # Map GDB fields to expected fields using the matched fields dictionary
                    for expected_field, gdb_field in matched_fields.items():
                        matched_feature[expected_field] = feature['properties'].get(gdb_field)
                    features.append(matched_feature)
                all_features = features
    
    return json.dumps(all_features)

def read_and_match_gdb_to_json(gdb_path, matched_fields, target_crs, layer_name=None):
    """
    Reads a GDB, extracts and matches fields, projects geometries, and returns JSON data for a specific layer or all layers.
    
    :param gdb_path: Path to the Geodatabase (GDB)
    :param matched_fields: Dictionary mapping expected fields to GDB fields
    :param target_crs: Target coordinate reference system (EPSG code, e.g., 'EPSG:4326')
    :param layer_name: Optional specific layer name to process. If None, processes all layers.
    :return: JSON string containing matched features
    """
    all_features = []

    with fiona.Env():
        # If a specific layer is provided, process only that layer
        layers_to_process = [layer_name] if layer_name else fiona.listlayers(gdb_path)
        
        # Loop through each specified layer
        for layer in layers_to_process:
            with fiona.open(gdb_path, layer=layer) as layer_data:
                source_crs = layer_data.crs  # Get the CRS of the layer
                transformer = Transformer.from_crs(source_crs, target_crs, always_xy=True)

                for feature in layer_data:
                    matched_feature = {}
                    
                    # Map GDB fields to expected fields using the matched fields dictionary
                    for expected_field, gdb_field in matched_fields.items():
                        matched_feature[expected_field] = feature['properties'].get(gdb_field)

                    # Project the geometry
                    geom = feature['geometry']
                    #print(geom['type'] )
                    if geom['type'] in ['Point', 'LineString', 'Polygon','MultiPolygon']:
                        # Transform the coordinates
                        if geom['type'] == 'Point':
                            x, y = geom['coordinates']
                            projected_coords = transformer.transform(x, y)
                            matched_feature['geom'] = {
                                'type': 'Point',
                                'coordinates': projected_coords
                            }
                        elif geom['type'] == 'LineString':
                            projected_coords = [transformer.transform(x, y) for x, y in geom['coordinates']]
                            matched_feature['geom'] = {
                                'type': 'LineString',
                                'coordinates': projected_coords
                            }
                        elif geom['type'] == 'Polygon':
                            projected_coords = [ [transformer.transform(x, y) for x, y in ring] for ring in geom['coordinates']]
                            print(projected_coords)
                            matched_feature['geom'] = {
                                'type': 'Polygon',
                                'coordinates': projected_coords
                            }
                        elif geom['type'] == 'MultiPolygon':
                            projected_coords = []
                            for polygon in geom['coordinates']:
                                projected_polygon = []
                                for ring in polygon:
                                    # Ensure each coordinate pair is correctly unpacked
                                    projected_ring = []
                                    for coord in ring:
                                        projected_point = transformer.transform(coord[0], coord[1])
                                        projected_ring.append(projected_point)
                                        #print(projected_ring)
                                     
                                    projected_polygon.append(projected_ring)
                                projected_coords.append(projected_polygon)

                            matched_feature['geom'] = {
                                'type': 'MultiPolygon',
                                'coordinates': projected_coords
                            }
                            
                            #print(matched_feature)

                    all_features.append(matched_feature)
    
    return json.dumps(all_features)

def send_to_endpoint(url, data, token):
    """
    Sends the JSON data to the specified endpoint using the access token.
    """
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
        'x-access-token': f'{token}'
    }
    formData  = {
            "model": "parcel" ,
            "data":  data 
            }
    
    
    response = requests.post(url, json=formData, headers=headers)
    #print(response)
    return response

# Parameters
gdb_path = "TanaRiver.gdb"  # Path to your GDB
auth_url = "https://kesmis.go.ke/api/auth/signin"  # Login endpoint
fetch_fields_url = "https://kesmis.go.ke/api/v1/model/fields"  # Endpoint to fetch expected fields
send_data_url = "https://kesmis.go.ke/api/v1/data/import/upsert"  # Endpoint to send data

# Authentication details
username = "***REDACTED***"
password = "***REDACTED***"
target_crs = 'EPSG:4326'  # Define the target CRS here, for example, WGS84

# Authenticate and get token
try:
    token = login_and_get_token(auth_url, username, password)
    
    if token:
        # Fetch expected fields and match GDB fields
        expected_fields = fetch_expected_fields(fetch_fields_url, token)
        
        with fiona.open(gdb_path, layer=None) as gdb:
            
            gdb_fields = gdb.schema['properties'].keys()
            
            matched_fields = match_fields(gdb_fields, expected_fields)
            print('matches -->', matched_fields)   
        # Process and send matched data
        #json_data = read_and_match_gdb_to_json(gdb_path, matched_fields,'Parcel')
        json_data = read_and_match_gdb_to_json(gdb_path, matched_fields, target_crs, 'Parcel')
        #print(json_data)
        
        
        response = send_to_endpoint(send_data_url, json_data, token)
        
        # Check response
        if response.status_code == 200:
            print("Data successfully sent!",response.text)
        else:
            print("Failed to send data:", response.status_code, response.text)
    else:
        print("Failed to obtain token, aborting process.")
except Exception as e:
    print("An error occurred:", e)
