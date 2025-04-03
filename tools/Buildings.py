import pandas as pd
import geopandas as gpd
from shapely import wkt
from pathlib import Path

# File paths
csv_path = Path("open_buildings_v3_polygons_ne_110m_KEN.csv")  # Update with actual CSV file
aoi_path = Path("aoi.geojson")  # Update with actual AOI file path
output_dir = Path("output_buildings")  # Directory for saving results
output_dir.mkdir(exist_ok=True)  # Ensure directory exists

# Load AOI Boundaries
print("🌍 Loading AOI boundaries...")
aoi_gdf = gpd.read_file(aoi_path)

# Ensure 'name' property exists
if "name" not in aoi_gdf.columns:
    raise ValueError("The AOI GeoJSON must have a 'name' property for unique filenames.")

# Process CSV in chunks, reading only "geometry" column
chunksize = 500_000  # Adjust based on memory capacity
print("🔍 Loading and processing CSV in chunks...")

for _, aoi in aoi_gdf.iterrows():
    aoi_name = aoi["name"].replace(" ", "_")  # Ensure safe filename
    aoi_geom = aoi.geometry  # Get AOI geometry
    output_path = output_dir / f"{aoi_name}.parquet"

    print(f"\n🚀 Processing AOI: {aoi_name}...")

    chunk_counter = 0
    found_buildings = False  # Flag to stop early

    for chunk in pd.read_csv(csv_path, usecols=["geometry"], chunksize=chunksize):
        chunk_counter += 1
        print(f"📦 Processing chunk {chunk_counter}: {len(chunk):,} rows...")

        # Convert WKT to geometry
        chunk["geometry"] = chunk["geometry"].apply(wkt.loads)

        # Convert to GeoDataFrame
        gdf_chunk = gpd.GeoDataFrame(chunk, geometry="geometry", crs="EPSG:4326")

        # Clip to AOI
        gdf_filtered = gdf_chunk[gdf_chunk.intersects(aoi_geom)]

        # If buildings found, save and stop processing
        if not gdf_filtered.empty:
            print(f"✅ Found {len(gdf_filtered):,} buildings in {aoi_name} (Chunk {chunk_counter}). Saving and moving to next AOI...")
            gdf_filtered.to_parquet(output_path, index=False)
            found_buildings = True
            break  # Stop processing further chunks for this AOI

    if not found_buildings:
        print(f"⚠️ No buildings found within AOI: {aoi_name}.")

print("\n🎉 Processing complete! Check the 'output_buildings' directory for results.")
