// Shared module-level caches for dashboard geo and indicator config data.
// Lives outside any component so values persist across navigations in the session.

export const geoCache = new Map<string, any>()
export const indicatorConfigCache = new Map<number, number[]>()
