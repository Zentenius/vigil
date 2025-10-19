/**
 * Calculate distance between two geographic points using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate bearing from point A to point B
 */
export const calculateBearing = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const θ = Math.atan2(y, x)
  return ((θ * 180) / Math.PI + 360) % 360
}

/**
 * Filter hazards within specified radius
 */
export const filterHazardsByRadius = (
  hazards: any[],
  userLocation: { lat: number; lng: number },
  radiusMeters: number = 150
): any[] => {
  return hazards
    .map(hazard => ({
      ...hazard,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        hazard.latitude,
        hazard.longitude
      )
    }))
    .filter(hazard => hazard.distance! <= radiusMeters)
    .sort((a, b) => a.distance! - b.distance!)
}
