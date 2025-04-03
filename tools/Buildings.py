import pandas as pd
import geopandas as gpd
from shapely import wkt
from pathlib import Path

# ---------------------------------------
# Step 1: Read Google Open Buildings CSV
# ---------------------------------------
csv_path = Path("/path/to/your/open_buildings_tile.csv")  # Update with actual CSV file
print("🔍 Loading CSV...")
df = pd.read_csv(csv_path)
# Convert WKT to geometry
print("📐 Parsing geometries...")
df["geometry"] = df["geometry"].apply(wkt.loads)
gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")
# ---------------------------------------
# Step 2: Load AOI Boundary (GeoJSON/Shapefile)
# ---------------------------------------
aoi = gpd.read_file("/path/to/your/aoi_boundary.geojson")  # Replace with your AOI file path
aoi_geom = aoi.geometry.union_all()  # Single MultiPolygon for spatial filtering
# ---------------------------------------
# Step 3: Clip Buildings to AOI
# ---------------------------------------
print("✂️  Clipping buildings to AOI...")
gdf_aoi = gdf[gdf.intersects(aoi_geom)]
print(f"✅ Found {len(gdf_aoi):,.0f} buildings within AOI")
# ---------------------------------------
# Step 4: Export as GeoParquet (Efficient Format)
# ---------------------------------------
output_path = Path("google_open_buildings_aoi.parquet")
gdf_aoi.to_parquet(output_path, index=False)
print(f"📦 Exported clipped buildings to {output_path}")
