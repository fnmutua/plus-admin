import pandas as pd
import geopandas as gpd
from shapely import wkt, prepared
from pathlib import Path
import warnings

# Suppress warnings about CRS
warnings.filterwarnings('ignore', message='.*CRS.*')

# File paths
csv_path = Path("open_buildings_v3_polygons_ne_110m_KEN.csv")
aoi_path = Path("Rennaisance.geojson")
output_path = Path("Rennaisance_buffered.parquet")

def main():
    # 1. Load and prepare AOI with buffer in geographic coordinates
    print("🌍 Loading and buffering AOI boundary...")
    aoi = gpd.read_file(aoi_path)
    
    # Fix invalid geometries and create a single union
    aoi['geometry'] = aoi.geometry.buffer(0)
    
    # Apply buffer in degrees (approximate conversion - adjust buffer_size as needed)
    # Note: 0.001 degrees ≈ 111 meters at equator (less towards poles)
    buffer_size = 0.0009  # ≈ 100 meters near equator (adjust for your latitude)
    aoi['geometry'] = aoi.geometry.buffer(buffer_size)
    
    aoi_geom = aoi.geometry.unary_union
    prepared_aoi = prepared.prep(aoi_geom)
    
    # 2. Process CSV in optimized chunks
    chunksize = 1000_000
    filtered_chunks = []
    total_processed = 0
    chunk_counter = 0
    
    print("🔍 Processing CSV in chunks...")
    
    for chunk in pd.read_csv(csv_path, usecols=["geometry"], chunksize=chunksize):
        chunk_counter += 1
        total_processed += len(chunk)
        print(f"📦 Chunk {chunk_counter}: Processing {len(chunk):,} rows (Total: {total_processed:,})...")
        
        # Convert WKT to geometry
        geometries = chunk['geometry'].apply(wkt.loads)
        gseries = gpd.GeoSeries(geometries, crs="EPSG:4326")
        
        # Bounding box check
        bounds = gseries.bounds
        in_aoi_bbox = (
            (bounds['minx'] >= aoi_geom.bounds[0]) & 
            (bounds['maxx'] <= aoi_geom.bounds[2]) &
            (bounds['miny'] >= aoi_geom.bounds[1]) & 
            (bounds['maxy'] <= aoi_geom.bounds[3])
        )
        
        # Precise geometry check
        candidates = gseries[in_aoi_bbox]
        if len(candidates) > 0:
            in_aoi = candidates.apply(lambda g: prepared_aoi.contains(g))
            filtered = candidates[in_aoi]
            
            if len(filtered) > 0:
                filtered_chunks.append(gpd.GeoDataFrame({'geometry': filtered}, crs="EPSG:4326"))
                print(f"✅ Found {len(filtered):,} buildings in buffered AOI (Chunk {chunk_counter})")
        
        # Clear memory
        del chunk, geometries, gseries, bounds, in_aoi_bbox, candidates
                
    # 3. Save results
    if filtered_chunks:
        final_gdf = pd.concat(filtered_chunks, ignore_index=True)
        final_gdf.to_parquet(output_path, index=False)
        print(f"\n🎉 Finished! Processed {total_processed:,} total rows")
        print(f"📦 Exported {len(final_gdf):,} buildings to {output_path}")
    else:
        print("\n⚠️ No buildings found within buffered AOI.")

if __name__ == "__main__":
    main()