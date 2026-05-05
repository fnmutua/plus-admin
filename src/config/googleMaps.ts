/**
 * Google Maps Platform key (JavaScript API, Static Map, Geocode, etc.).
 * Set `VITE_GOOGLE_MAPS_API_KEY` in `.env` and in your deployment environment.
 */
export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()
