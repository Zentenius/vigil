/**
 * Weather Service using Open-Meteo API (Free, no API key required)
 * Provides real-time weather data to help predict flood/fire/wind hazards
 */

export interface WeatherData {
  temperature: number
  humidity: number
  precipitation: number
  windSpeed: number
  conditions: string
  pressure: number
  windGusts?: number
  cloudCover?: number
}

export class WeatherService {
  private static BASE_URL = 'https://api.open-meteo.com/v1'

  /**
   * Get current weather data for a specific location
   * Uses Open-Meteo API which doesn't require authentication
   */
  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,pressure_msl,cloud_cover&timezone=auto`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }

      const data = await response.json()
      const current = data.current

      return {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation || 0,
        windSpeed: current.wind_speed_10m,
        windGusts: current.wind_gusts_10m,
        cloudCover: current.cloud_cover,
        conditions: this.interpretWeatherCode(current.weather_code),
        pressure: current.pressure_msl
      }
    } catch (error) {
      console.error('Weather Service Error:', error)
      return null
    }
  }

  /**
   * Get weather forecast for the next 7 days
   * Useful for predicting future hazard patterns
   */
  static async getForecast(lat: number, lng: number, days: number = 7): Promise<any[] | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&forecast_days=${days}&timezone=auto`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch forecast data')
      }

      const data = await response.json()
      return data.daily.time.map((date: string, index: number) => ({
        date,
        maxTemp: data.daily.temperature_2m_max[index],
        minTemp: data.daily.temperature_2m_min[index],
        precipitation: data.daily.precipitation_sum[index],
        windSpeed: data.daily.wind_speed_10m_max[index],
        humidity: data.daily.relative_humidity_2m_max[index],
        conditions: this.interpretWeatherCode(data.daily.weather_code[index])
      }))
    } catch (error) {
      console.error('Forecast Service Error:', error)
      return null
    }
  }

  /**
   * Interpret WMO Weather codes to human readable conditions
   * Reference: https://www.noaa.gov/
   */
  private static interpretWeatherCode(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: 'clear',
      1: 'mainly clear',
      2: 'partly cloudy',
      3: 'overcast',
      45: 'foggy',
      48: 'foggy',
      51: 'light drizzle',
      53: 'moderate drizzle',
      55: 'dense drizzle',
      61: 'slight rain',
      63: 'moderate rain',
      65: 'heavy rain',
      71: 'slight snow',
      73: 'moderate snow',
      75: 'heavy snow',
      77: 'snow grains',
      80: 'slight rain showers',
      81: 'moderate rain showers',
      82: 'violent rain showers',
      85: 'slight snow showers',
      86: 'heavy snow showers',
      95: 'thunderstorm',
      96: 'thunderstorm with hail',
      99: 'thunderstorm with large hail'
    }
    return weatherCodes[code] || 'unknown'
  }
}
