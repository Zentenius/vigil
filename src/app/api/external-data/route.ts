/**
 * API route for fetching external data
 * Weather, air quality, seismic, and disaster data
 */

import { NextRequest, NextResponse } from 'next/server'
import { WeatherService } from '~/lib/weatherService'
import { AirQualityService } from '~/lib/airQualityService'
import { EarthquakeService } from '~/lib/earthquakeService'
import { ReliefWebService } from '~/lib/reliefWebService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, country, action } = body

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Route to specific action
    switch (action) {
      case 'weather':
        return await getWeatherData(lat, lng)
      case 'airQuality':
        return await getAirQualityData(lat, lng)
      case 'seismic':
        return await getSeismicData(lat, lng)
      case 'disasters':
        return await getDisasterData(country)
      case 'all':
        return await getAllExternalData(lat, lng, country)
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('External data API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch external data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getWeatherData(lat: number, lng: number) {
  try {
    const data = await WeatherService.getCurrentWeather(lat, lng)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Weather fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data', data: null },
      { status: 200 } // Return 200 with null data to not break the flow
    )
  }
}

async function getAirQualityData(lat: number, lng: number) {
  try {
    const data = await AirQualityService.getAirQuality(lat, lng)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Air quality fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch air quality data', data: null },
      { status: 200 }
    )
  }
}

async function getSeismicData(lat: number, lng: number) {
  try {
    const data = await EarthquakeService.getSeismicRisk(lat, lng, 150)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Seismic fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seismic data', data: null },
      { status: 200 }
    )
  }
}

async function getDisasterData(country?: string) {
  try {
    if (!country) {
      return NextResponse.json({ data: null })
    }
    const data = await ReliefWebService.getNearbyDisasters(country)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Disaster fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch disaster data', data: null },
      { status: 200 }
    )
  }
}

async function getAllExternalData(lat: number, lng: number, country?: string) {
  try {
    const [weather, airQuality, seismic, disasters] = await Promise.all([
      WeatherService.getCurrentWeather(lat, lng).catch(() => null),
      AirQualityService.getAirQuality(lat, lng).catch(() => null),
      EarthquakeService.getSeismicRisk(lat, lng, 150).catch(() => null),
      country ? ReliefWebService.getNearbyDisasters(country).catch(() => null) : Promise.resolve(null)
    ])

    return NextResponse.json({
      data: {
        weather,
        airQuality,
        seismic: seismic,
        disasters
      }
    })
  } catch (error) {
    console.error('All external data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch external data', data: null },
      { status: 500 }
    )
  }
}
