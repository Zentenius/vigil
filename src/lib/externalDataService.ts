/**
 * External Data Service
 * Aggregates all external APIs for predictive hazard analysis
 */

import { WeatherService, type WeatherData } from './weatherService'
import { AirQualityService, type AirQualityData } from './airQualityService'
import { EarthquakeService, type SeismicRiskData } from './earthquakeService'
import { ReliefWebService, type DisasterData } from './reliefWebService'

export interface ExternalDataPoint {
  weather: WeatherData | null
  airQuality: AirQualityData | null
  seismicRisk: SeismicRiskData | null
  disasters: DisasterData | null
  timestamp: string
}

export class ExternalDataService {
  /**
   * Get comprehensive external data for a location
   * Combines weather, air quality, seismic, and disaster data
   */
  static async getLocationData(
    lat: number,
    lng: number,
    country?: string
  ): Promise<ExternalDataPoint | null> {
    try {
      const [weather, airQuality, seismicRisk, disasters] = await Promise.all([
        WeatherService.getCurrentWeather(lat, lng),
        AirQualityService.getAirQuality(lat, lng),
        EarthquakeService.getSeismicRisk(lat, lng, 150),
        country ? ReliefWebService.getNearbyDisasters(country) : Promise.resolve(null)
      ])

      return {
        weather,
        airQuality,
        seismicRisk,
        disasters,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to fetch external data:', error)
      return null
    }
  }

  /**
   * Get weather forecast data
   */
  static async getWeatherForecast(lat: number, lng: number, days: number = 7) {
    return WeatherService.getForecast(lat, lng, days)
  }

  /**
   * Get recent nearby earthquakes
   */
  static async getNearbyEarthquakes(
    lat: number,
    lng: number,
    radius: number = 100,
    minMagnitude: number = 2.5
  ) {
    return EarthquakeService.getNearbyEarthquakes(lat, lng, radius, minMagnitude)
  }

  /**
   * Search for specific disaster types
   */
  static async searchDisasters(
    type: string,
    country?: string,
    limit: number = 10
  ) {
    return ReliefWebService.searchDisasters(type, country, limit)
  }
}
