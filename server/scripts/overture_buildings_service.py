"""
Overture Building Footprints Service
====================================

HTTP service that:
  - Accepts a GeoJSON Polygon / MultiPolygon / Feature / FeatureCollection
  - Downloads Overture Maps building footprints for the geometry bbox
  - Clips footprints to the polygon
  - Returns building count + GeoJSON FeatureCollection

Requirements (same Python env as population_service.py):
  pip install -r requirements-overture-service.txt

Uses the overturemaps Python API (geodataframe) — no overturemaps CLI on PATH required.

Run separately:
  cd server/scripts
  python overture_buildings_service.py

Or:
  uvicorn overture_buildings_service:app --host 0.0.0.0 --port 8001 --reload

Endpoints:
  POST http://127.0.0.1:8001/buildings_in_polygon
  GET  http://127.0.0.1:8001/health

Configure Node API (.env):
  OVERTURE_BUILDINGS_SERVICE_URL=http://127.0.0.1:8001
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import Body, FastAPI, HTTPException, Query

from overture_buildings_core import fetch_buildings_for_geojson

app = FastAPI(title="Overture Building Footprints Service")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "overture_buildings"}


@app.post("/buildings_in_polygon")
def buildings_in_polygon_post(
    body: Dict[str, Any] = Body(
        ...,
        description="GeoJSON Polygon/MultiPolygon, Feature, or FeatureCollection",
    ),
) -> Dict[str, Any]:
    try:
        return fetch_buildings_for_geojson(body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/buildings_in_polygon")
def buildings_in_polygon_get(
    polygon_wkt: str = Query(..., description="Polygon geometry in WKT (EPSG:4326)."),
) -> Dict[str, Any]:
    try:
        from shapely import wkt as shapely_wkt

        geom = shapely_wkt.loads(polygon_wkt)
        payload = {"type": "Polygon", "coordinates": [list(geom.exterior.coords)]}
        return fetch_buildings_for_geojson(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("overture_buildings_service:app", host="0.0.0.0", port=8001, reload=True)
