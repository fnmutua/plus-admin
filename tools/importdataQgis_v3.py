import requests
import json
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, mapping
from shapely.ops import transform
from fuzzywuzzy import process
from datetime import datetime
import uuid

# API Endpoints
BASE_URL = "http://localhost"
LOGIN_URL = f"{BASE_URL}/api/auth/signin"
SCHEMA_URL = f"{BASE_URL}/api/v1/model/fields"
UPLOAD_URL = f"{BASE_URL}/api/v1/data/import/upsert"
PARENT_URL = f"{BASE_URL}/api/v1/data/code"  # Hypothetical URL for fetching parent data by pcode

# API Credentials
USERNAME = "***REDACTED***"
PASSWORD = "***REDACTED***"
PARENT = "ward"
# GeoJSON File
GEOJSON_FILE = "test_data.json"

ARRAY_FIELDS = {"development", "structure_types", "typical_building_materials"}  # Define known array-type fields
PARENT_FIELDS = ["county_id", "subcounty_id"]  # List of fields to be replaced with parent data

def get_auth_token():
    """Authenticate and return an API token."""
    response = requests.post(LOGIN_URL, json={"username": USERNAME, "password": PASSWORD})
    response.raise_for_status()
    return response.json().get("accessToken")

def get_table_schema(token, table_name):
    """Fetch database table schema by sending table name in request body."""
    headers = {
        "Authorization": f"Bearer {token}",
        "x-access-token": token,
        "Content-Type": "application/json"
    }
    response = requests.post(SCHEMA_URL, headers=headers, json={"model": table_name})
    response.raise_for_status()
    return [field["field"] for field in response.json().get("data", [])]

def fuzzy_match(fields, geojson_properties):
    """Match GeoJSON properties to database fields using fuzzy matching."""
    matched_fields = {}
    for prop in geojson_properties:
        if prop.lower() == "pcode":  # Skip the 'pcode' field
            continue
        best_match, score = process.extractOne(prop, fields)
        if score > 70:  # Adjust threshold if necessary
            matched_fields[prop] = best_match
    return matched_fields

def read_geojson():
    """Read GeoJSON file and return GeoDataFrame."""
    return gpd.read_file(GEOJSON_FILE)

def get_parent_data(pcode, token):
    """Fetch the parent data based on pcode."""
    headers = {
        "Authorization": f"Bearer {token}",
        "x-access-token": token,
        "Content-Type": "application/json"
    }
    #response = requests.get(PARENT_URL, headers=headers, json={"pcode": pcode, "model": PARENT})
    response = requests.get(f"{PARENT_URL}?code={pcode}&model={PARENT}", headers=headers)

    response.raise_for_status()
    #return response.json()  # Assuming the parent data is returned in a JSON format
    return response.json().get("data")[0]

def default_serializer(obj):
    """Custom serializer for datetime, Pandas Series, and Timestamps."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, pd.Series):
        return obj.tolist()
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def format_geometry(geom):
    """Convert geometries to a valid GeoJSON format."""
    if geom.geom_type == "Point":
        return {"type": "Point", "coordinates": list(geom.coords[0])}
    elif geom.geom_type == "LineString":
        return {"type": "LineString", "coordinates": list(geom.coords)}
    elif geom.geom_type == "Polygon":
        return {"type": "Polygon", "coordinates": [list(geom.exterior.coords)]}
    elif geom.geom_type == "MultiPolygon":
        return {"type": "MultiPolygon", "coordinates": [
            [list(poly.exterior.coords)] for poly in geom.geoms
        ]}
    return None

def process_and_upload(token, table_name):
    """Process GeoJSON and upload data."""
    schema_fields = get_table_schema(token, table_name)

    # Read GeoJSON and ensure it's in WGS 84 (EPSG:4326)
    gdf = gpd.read_file(GEOJSON_FILE).to_crs(epsg=4326)
    print(gdf['settlement_type'])

    # Convert geometry to formatted GeoJSON
    gdf["geom"] = gdf.geometry.apply(format_geometry)

    # Match schema fields to GeoJSON fields
    matched_fields = fuzzy_match(schema_fields, gdf.columns)

    # Rename columns based on matched fields
    gdf = gdf.rename(columns=matched_fields)

    # Convert DataFrame to list of dictionaries
    payload = gdf.to_dict(orient="records")

    # Ensure "geom" is correctly included and structure arrays properly
    for item in payload:
        item["geom"] = item.pop("geom", None)  # Move geom key to ensure proper structure
        item["code"] = str(uuid.uuid4())  # Generate a UUID for each feature
        item.pop("id", None)  # Remove the 'id' column if it exists

        # Convert comma-separated strings to arrays for known array fields
        for field in ARRAY_FIELDS:
            if field in item:
                if isinstance(item[field], str):
                    item[field] = [x.strip() for x in item[field].split(",") if x.strip()] if item[field] else []
                elif item[field] is None:
                    item[field] = []  # Ensure None values become empty lists

        # Fetch parent data using the pcode and update specified fields
        if "pcode" in item:
            parent_data = get_parent_data(item["pcode"], token)
            print(parent_data)
            for field in PARENT_FIELDS:
                if field in parent_data:
                    item[field] = parent_data[field]  # Replace field with the corresponding parent data
                    print(field)

        if PARENT == "ward":
            item["ward_id"] = parent_data.get("id")  # Replace ward_id with the parent id
            print(f"Updated ward_id: {item['ward_id']}")
        elif PARENT == "county":
            item["county_id"] = parent_data.get("id")  # Replace county_id with the parent id
            print(f"Updated county_id: {item['county_id']}")
        elif PARENT == "subcounty":
            item["subcounty_id"] = parent_data.get("id")  # Replace subcounty_id with the parent id
            print(f"Updated subcounty_id: {item['subcounty_id']}")

    # Convert to JSON with correct structure
        
    payload_json = json.dumps({"data": payload, "model": "settlement"}, 
                              default=default_serializer, indent=4)

    # Print JSON for verification
    #print(payload_json)

    # Upload data
    headers = {
        "Authorization": f"Bearer {token}",
        "x-access-token": token,
        "Content-Type": "application/json"
    }
    response = requests.post(UPLOAD_URL, data=payload_json, headers=headers)
    response.raise_for_status()
    print("Upload successful:", response.json())

    return payload_json  # Return JSON string if needed


if __name__ == "__main__":
    try:
        token = get_auth_token()
        table_name = "settlement"
        process_and_upload(token, table_name)
    except requests.RequestException as e:
        print("Error:", e)
