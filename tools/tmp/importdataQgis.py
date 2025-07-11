import requests
import json
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, mapping
from shapely.ops import transform
from functools import partial
import pyproj
from fuzzywuzzy import process
from datetime import datetime
import uuid


# API Endpoints
BASE_URL = "http://localhost"
LOGIN_URL = f"{BASE_URL}/api/auth/signin"
SCHEMA_URL = f"{BASE_URL}/api/v1/model/fields"
UPLOAD_URL = f"{BASE_URL}/api/v1/data/import/upsert"

# API Credentials
USERNAME = "***REDACTED***"
PASSWORD = "***REDACTED***"

# GeoJSON File
GEOJSON_FILE = "test_data.json"

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

def remove_z(geometry):
    """Convert 3D geometry to 2D by stripping Z values."""
    if geometry.has_z:
        return transform(lambda x, y, z=None: (x, y), geometry)
    return geometry  # Already 2D

def default_serializer(obj):
    """Custom serializer for datetime, Pandas Series, and Timestamps."""
    if isinstance(obj, datetime):
        return obj.isoformat()  # Convert datetime to ISO 8601 format
    if isinstance(obj, pd.Series):
        return obj.tolist()  # Convert Pandas Series to a list
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()  # Convert Pandas Timestamp to string
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
    return None  # Handle unknown geometries safely

def process_and_upload(token, table_name):
    """Process GeoJSON and upload data."""
    schema_fields = get_table_schema(token, table_name)

    # Read GeoJSON and ensure it's in WGS 84 (EPSG:4326)
    gdf = gpd.read_file(GEOJSON_FILE).to_crs(epsg=4326)

    # Convert geometry to formatted GeoJSON
    gdf["geom"] = gdf.geometry.apply(format_geometry)

    # Match schema fields to GeoJSON fields
    matched_fields = fuzzy_match(schema_fields, gdf.columns)

    # Rename columns based on matched fields
    gdf = gdf.rename(columns=matched_fields)

    # Drop the original geometry column
    #gdf = gdf.drop(columns=["geometry"])

    # Convert DataFrame to list of dictionaries
    payload = gdf.to_dict(orient="records")

    # Ensure "geom" is correctly included and structured
    for item in payload:
        item["geom"] = item.pop("geom", None)  # Move geom key to ensure proper structure
        item["code"] = str(uuid.uuid4()) 

    # Convert to JSON with correct structure
    payload_json = json.dumps({"data": payload, "model": "settlement"}, 
                              default=default_serializer, indent=4)

    # Print JSON for verification
    print(payload_json)

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
