#!/usr/bin/env python3
"""
CLI helper: read GeoJSON from stdin, print { count, geojson } to stdout.
Prefer running overture_buildings_service.py and calling it over HTTP.
"""
from __future__ import annotations

import json
import sys

from overture_buildings_core import fetch_buildings_for_geojson


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        print(json.dumps({"error": f"Invalid JSON input: {exc}"}))
        return 1

    geom = payload.get("geometry")
    if not geom:
        print(json.dumps({"error": "Missing geometry"}))
        return 1

    try:
        result = fetch_buildings_for_geojson(geom)
        print(json.dumps(result))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
