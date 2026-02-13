# Public Settlement Register API

These endpoints are used by the **landing page Settlement Register** and must work **without authentication**.

## Base path

All routes are under: `GET /api/public/register/...`

## Endpoints

| Method | Path | Query / params | Response |
|--------|------|----------------|----------|
| GET | `/api/public/register/settlements` | `page`, `limit`, `search`, `county_id`, `subcounty_id`, `ward_id` | `{ data: Settlement[], total: number }` or `{ documents: Settlement[], total: number }` |
| GET | `/api/public/register/settlements/map` | `county_id`, `subcounty_id`, `ward_id`, `limit` | GeoJSON `{ type: "FeatureCollection", features: Feature[] }` (centroids only) |
| GET | `/api/public/register/settlements/:id` | — | `{ data: Settlement }` (name, population, county, subcounty, ward) |
| GET | `/api/public/register/counties` | — | `{ data: { id, name }[] }` |
| GET | `/api/public/register/subcounties` | `county_id` | `{ data: { id, name }[] }` |
| GET | `/api/public/register/wards` | `subcounty_id` | `{ data: { id, name }[] }` |

## Settlement shape (list and single)

- `id`, `name`, `population` (optional)
- `county`: `{ id, name }` or null
- `subcounty`: `{ id, name }` or null  
- `ward`: `{ id, name }` or null

## Map GeoJSON

- Each feature must have `geometry` (Point) and `properties.id` (settlement id).
- Only approved/active settlements should be returned.
