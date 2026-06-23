"""
Shared Overture building fetch + clip logic (used by FastAPI service and CLI helper).
Uses the overturemaps Python API — no CLI subprocess required.
"""
from __future__ import annotations

import json
import uuid
from typing import Any, Dict

import geopandas as gpd
from shapely.geometry import shape
from shapely.ops import unary_union


def geometry_from_geojson_like(obj: Dict[str, Any]):
    """Accept geometry, Feature, or FeatureCollection; return one Shapely geometry."""
    t = obj.get("type")

    if t == "Feature":
        geom = obj.get("geometry")
        if geom is None:
            raise ValueError("Feature is missing 'geometry' field")
        return shape(geom)

    if t == "FeatureCollection":
        features = obj.get("features") or []
        geoms = []
        for feature in features:
            g = feature.get("geometry")
            if g is not None:
                geoms.append(shape(g))
        if not geoms:
            raise ValueError("FeatureCollection has no valid geometries")
        return unary_union(geoms)

    return shape(obj)


def download_buildings_for_bbox(bbox: tuple[float, float, float, float]) -> gpd.GeoDataFrame:
    """
    Fetch Overture building footprints for bbox (minx, miny, maxx, maxy) via Python API.
    """
    try:
        from overturemaps.core import geodataframe
    except ImportError as exc:
        raise RuntimeError(
            "overturemaps is not installed. Run: pip install overturemaps geopandas pyarrow shapely"
        ) from exc

    try:
        buildings = geodataframe("building", bbox=bbox, stac=True)
    except Exception as exc:
        raise RuntimeError(f"Overture building download failed: {exc}") from exc

    if buildings is None or buildings.empty:
        return gpd.GeoDataFrame(columns=["geometry"], crs="EPSG:4326")

    if buildings.crs is None:
        buildings = buildings.set_crs("EPSG:4326")
    elif str(buildings.crs) != "EPSG:4326":
        buildings = buildings.to_crs("EPSG:4326")

    return buildings


def clip_buildings(buildings: gpd.GeoDataFrame, settlement_geom) -> gpd.GeoDataFrame:
    buildings = buildings[buildings.geometry.notnull()].copy()
    buildings = buildings[buildings.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    clipped = buildings[buildings.intersects(settlement_geom)].copy()
    if clipped.empty:
        return clipped

    clipped["code"] = [str(uuid.uuid4())[:8] for _ in range(len(clipped))]
    clipped["source"] = "overture"
    return clipped[["code", "source", "geometry"]]


def fetch_buildings_for_geojson(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Count + clip Overture buildings for a GeoJSON-like payload.
    Returns { count, geojson }.
    """
    settlement_geom = geometry_from_geojson_like(body)
    minx, miny, maxx, maxy = settlement_geom.bounds
    bbox = (float(minx), float(miny), float(maxx), float(maxy))

    buildings = download_buildings_for_bbox(bbox)
    clipped = clip_buildings(buildings, settlement_geom)

    if clipped.empty:
        fc: Dict[str, Any] = {"type": "FeatureCollection", "features": []}
    else:
        fc = json.loads(clipped.to_json())

    return {"count": len(clipped), "geojson": fc}
