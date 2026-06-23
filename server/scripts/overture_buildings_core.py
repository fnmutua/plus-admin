"""
Shared Overture building fetch + clip logic (used by FastAPI service and CLI helper).
Uses the overturemaps Python API — no CLI subprocess required.
"""
from __future__ import annotations

import json
import math
import uuid
from typing import Any, Dict, List, Union

import geopandas as gpd
from shapely.geometry import shape
from shapely.ops import unary_union
from shapely.validation import make_valid

Coord = Union[float, int, str]
Coords = Union[Coord, List["Coords"]]


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid coordinate value: {value!r}") from exc


def drop_z_from_coords(coords: Coords) -> List[Any]:
    """Recursively drop Z/M dimensions and coerce to float pairs."""
    if isinstance(coords, (list, tuple)):
        if len(coords) >= 2 and isinstance(coords[0], (int, float, str)):
            return [_to_float(coords[0]), _to_float(coords[1])]
        return [drop_z_from_coords(c) for c in coords]
    raise ValueError(f"Invalid coordinate structure: {coords!r}")


def normalize_geojson_geometry(obj: Dict[str, Any]) -> Dict[str, Any]:
    """Return a 2D GeoJSON geometry dict with numeric coordinates."""
    geom_type = obj.get("type")
    if geom_type not in ("Polygon", "MultiPolygon"):
        raise ValueError(f"Unsupported geometry type: {geom_type}")

    coords = obj.get("coordinates")
    if not coords:
        raise ValueError("Geometry is missing coordinates")

    return {
        "type": geom_type,
        "coordinates": drop_z_from_coords(coords),
    }


def geometry_from_geojson_like(obj: Dict[str, Any]):
    """Accept geometry, Feature, or FeatureCollection; return one Shapely geometry."""
    if isinstance(obj, str):
        try:
            obj = json.loads(obj)
        except json.JSONDecodeError as exc:
            raise ValueError("Geometry string is not valid JSON") from exc

    t = obj.get("type")

    if t == "Feature":
        geom = obj.get("geometry")
        if geom is None:
            raise ValueError("Feature is missing 'geometry' field")
        return normalize_shapely_geometry(shape(normalize_geojson_geometry(geom)))

    if t == "FeatureCollection":
        features = obj.get("features") or []
        geoms = []
        for feature in features:
            g = feature.get("geometry")
            if g is not None:
                geoms.append(
                    normalize_shapely_geometry(
                        shape(normalize_geojson_geometry(g))
                    )
                )
        if not geoms:
            raise ValueError("FeatureCollection has no valid geometries")
        return unary_union(geoms)

    return normalize_shapely_geometry(
        shape(normalize_geojson_geometry(obj))
    )


def normalize_shapely_geometry(geom):
    """Repair invalid polygons and collapse to polygonal geometry when possible."""
    if geom is None or geom.is_empty:
        raise ValueError("Empty geometry")

    fixed = make_valid(geom)
    if fixed.geom_type == "GeometryCollection":
        polys = [
            g for g in fixed.geoms if g.geom_type in ("Polygon", "MultiPolygon")
        ]
        if not polys:
            raise ValueError("No polygon geometry after normalization")
        fixed = unary_union(polys)

    if fixed.geom_type not in ("Polygon", "MultiPolygon"):
        raise ValueError(f"Unsupported geometry type after normalization: {fixed.geom_type}")

    return fixed


def safe_bbox(
    geom,
    *,
    min_span: float = 0.0005,
    pad_ratio: float = 0.05,
) -> tuple[float, float, float, float]:
    """
    Build a finite WGS84 bbox for Overture queries.
    Expands tiny/degenerate envelopes so remote parquet filters stay valid.
    """
    minx, miny, maxx, maxy = geom.bounds
    if not all(math.isfinite(v) for v in (minx, miny, maxx, maxy)):
        raise ValueError("Geometry has non-finite bounds")

    width = maxx - minx
    height = maxy - miny

    if width <= 0:
        pad = max(min_span, abs(minx) * pad_ratio, 1e-6)
        minx -= pad
        maxx += pad
        width = maxx - minx

    if height <= 0:
        pad = max(min_span, abs(miny) * pad_ratio, 1e-6)
        miny -= pad
        maxy += pad
        height = maxy - miny

    if width < min_span:
        center = (minx + maxx) / 2
        minx = center - min_span / 2
        maxx = center + min_span / 2

    if height < min_span:
        center = (miny + maxy) / 2
        miny = center - min_span / 2
        maxy = center + min_span / 2

    minx = max(-180.0, float(minx))
    maxx = min(180.0, float(maxx))
    miny = max(-90.0, float(miny))
    maxy = min(90.0, float(maxy))

    if minx >= maxx or miny >= maxy:
        raise ValueError("Geometry bounds are invalid after normalization")

    return (minx, miny, maxx, maxy)


def _as_geodataframe(obj: Any) -> gpd.GeoDataFrame | None:
    """Coerce Overture/geopandas outputs into a GeoDataFrame when possible."""
    empty = gpd.GeoDataFrame(columns=["geometry"], crs="EPSG:4326")

    if obj is None:
        return empty

    if isinstance(obj, gpd.GeoDataFrame):
        gdf = obj
    elif isinstance(obj, dict):
        if obj.get("type") == "FeatureCollection":
            features = obj.get("features") or []
            if not features:
                return empty
            gdf = gpd.GeoDataFrame.from_features(features, crs="EPSG:4326")
        else:
            gdf = gpd.GeoDataFrame.from_features([obj], crs="EPSG:4326")
    elif isinstance(obj, list):
        if not obj:
            return empty
        gdf = gpd.GeoDataFrame.from_features(obj, crs="EPSG:4326")
    else:
        return None

    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    elif str(gdf.crs) != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    return gdf


def download_buildings_for_bbox(bbox: tuple[float, float, float, float]) -> gpd.GeoDataFrame:
    """
    Fetch Overture building footprints for bbox (minx, miny, maxx, maxy) via Python API.
    """
    try:
        from overturemaps.core import geodataframe, record_batch_reader
    except ImportError as exc:
        raise RuntimeError(
            "overturemaps is not installed. Run: pip install overturemaps geopandas pyarrow shapely"
        ) from exc

    errors: list[str] = []

    for use_stac in (True, False):
        try:
            reader = record_batch_reader("building", bbox=bbox, stac=use_stac)
            if reader is None:
                errors.append(f"stac={use_stac}: no data reader returned")
                continue

            try:
                buildings = gpd.GeoDataFrame.from_arrow(reader)
            except Exception as exc:
                errors.append(f"stac={use_stac}: {exc}")
                continue

            gdf = _as_geodataframe(buildings)
            if gdf is not None:
                return gdf
            errors.append(f"stac={use_stac}: unexpected result type {type(buildings)!r}")
        except Exception as exc:
            errors.append(f"stac={use_stac}: {exc}")

    # Last resort: direct geodataframe call (older overturemaps versions).
    for use_stac in (True, False):
        try:
            buildings = geodataframe("building", bbox=bbox, stac=use_stac)
            gdf = _as_geodataframe(buildings)
            if gdf is not None:
                return gdf
            errors.append(f"geodataframe stac={use_stac}: unexpected result type {type(buildings)!r}")
        except Exception as exc:
            errors.append(f"geodataframe stac={use_stac}: {exc}")

    raise RuntimeError(
        "Overture building download failed: " + "; ".join(errors)
    )


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
    bbox = safe_bbox(settlement_geom)

    buildings = download_buildings_for_bbox(bbox)
    clipped = clip_buildings(buildings, settlement_geom)

    if clipped.empty:
        fc: Dict[str, Any] = {"type": "FeatureCollection", "features": []}
    else:
        fc = json.loads(clipped.to_json())

    return {"count": len(clipped), "geojson": fc}
