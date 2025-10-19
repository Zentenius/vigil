/**
 * Earthquake Service using USGS Earthquake Hazards API (Free, no API key required)
 * Provides real-time seismic activity data to validate and highlight earthquake-related hazards
 */

export interface EarthquakeEvent {
  id: string
  magnitude: number
  depth: number // kilometers
  latitude: number
  longitude: number
  timestamp: string
  location: string
  distance?: number // km from query point
  url: string
}

export interface SeismicRiskData {
  recentEarthquakes: EarthquakeEvent[]
  seismicityLevel: 'low' | 'moderate' | 'high' | 'very high'
  averageMagnitude: number
  eventCount: number
}

export class EarthquakeService {
  private static BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'

  /**
   * Get recent earthquakes near a location
   * Filters by magnitude and distance to focus on relevant events
   */
  static async getNearbyEarthquakes(
    lat: number,
    lng: number,
    radiusKm: number = 100,
    minMagnitude: number = 2.5,
    hoursBack: number = 24
  ): Promise<EarthquakeEvent[] | null> {
    try {
      // Get all significant earthquakes from the last day
      const response = await fetch(
        `${this.BASE_URL}/significant_day.geojson`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch earthquake data')
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        return []
      }

      // Filter and distance-calculate
      const earthquakes = data.features
        .filter((feature: any) => {
          const magnitude = feature.properties.mag
          return magnitude >= minMagnitude
        })
        .map((feature: any) => {
          const coords = feature.geometry.coordinates
          const distance = this.calculateDistance(lat, lng, coords[1], coords[0])
          
          return {
            id: feature.id,
            magnitude: feature.properties.mag,
            depth: coords[2], // depth in km
            latitude: coords[1],
            longitude: coords[0],
            timestamp: new Date(feature.properties.time).toISOString(),
            location: feature.properties.place,
            distance,
            url: feature.properties.url
          }
        })
        .filter((eq: EarthquakeEvent) => (eq.distance ?? 0) <= radiusKm)
        .sort((a: EarthquakeEvent, b: EarthquakeEvent) => b.magnitude - a.magnitude)

      return earthquakes
    } catch (error) {
      console.error('Earthquake Service Error:', error)
      return null
    }
  }

  /**
   * Get seismic risk assessment for a location
   * Combines recent earthquake data with historical patterns
   */
  static async getSeismicRisk(
    lat: number,
    lng: number,
    radiusKm: number = 100
  ): Promise<SeismicRiskData | null> {
    try {
      const earthquakes = await this.getNearbyEarthquakes(lat, lng, radiusKm, 2.0, 168) // 7 days

      if (!earthquakes || earthquakes.length === 0) {
        return {
          recentEarthquakes: [],
          seismicityLevel: 'low',
          averageMagnitude: 0,
          eventCount: 0
        }
      }

      const avgMagnitude =
        earthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) / earthquakes.length

      let seismicityLevel: 'low' | 'moderate' | 'high' | 'very high' = 'low'
      if (earthquakes.length > 10 || avgMagnitude > 6) {
        seismicityLevel = 'very high'
      } else if (earthquakes.length > 5 || avgMagnitude > 5) {
        seismicityLevel = 'high'
      } else if (earthquakes.length > 2 || avgMagnitude > 4) {
        seismicityLevel = 'moderate'
      }

      return {
        recentEarthquakes: earthquakes.slice(0, 5), // Top 5 closest/strongest
        seismicityLevel,
        averageMagnitude: Math.round(avgMagnitude * 10) / 10,
        eventCount: earthquakes.length
      }
    } catch (error) {
      console.error('Seismic Risk Error:', error)
      return null
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Get magnitude interpretation
   */
  static getMagnitudeInterpretation(magnitude: number): string {
    if (magnitude < 3) return 'Minor - Usually not felt'
    if (magnitude < 4) return 'Light - Rarely causes damage'
    if (magnitude < 5) return 'Moderate - Can cause localized damage'
    if (magnitude < 6) return 'Strong - Significant damage likely'
    if (magnitude < 7) return 'Major - Widespread damage'
    return 'Great - Severe damage widespread'
  }
}
