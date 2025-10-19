/**
 * Enhanced Predictive Engine with External Data Integration
 * Analyzes hazard reports with real-time weather, air quality, seismic, and disaster data
 */

import { generateObject } from 'ai'
import { createMistral } from '@ai-sdk/mistral'
import { z } from 'zod'
import { calculateDistance } from '../utils/calculations'

// Ensure MISTRAL_API_KEY is available


// Create Mistral client with API key
const mistralClient = createMistral({
  apiKey: process.env.MISTRAL_API_KEY
})

export interface EnhancedReportData {
  id: string
  latitude: number
  longitude: number
  category: string
  tags: string[]
  severity_level: number
  timestamp: Date
  description: string
  ai_summary?: string
  credibility_score: number
  status: string
  user?: {
    name: string | null
    email: string | null
  }
}

export interface PredictionResult {
  id: string
  type: 'flood' | 'fire' | 'traffic' | 'environmental' | 'electrical' | 'medical' | 'earthquake' | 'hazmat'
  description: string
  confidence: number
  affected_area: {
    lat: number
    lng: number
    radius: number
  }
  expires_at: Date
  source_reports: string[]
  cluster_size: number
  reasoning: string
  weather_influence: string
  urgency_level: 'low' | 'medium' | 'high' | 'critical'
  external_context: {
    weather: any
    airQuality: any
    seismicRisk?: any
    disasters?: any
  }
}

const EnhancedPredictionSchema = z.object({
  predictions: z.array(
    z.object({
      type: z.enum(['flood', 'fire', 'traffic', 'environmental', 'electrical', 'medical', 'earthquake', 'hazmat']),
      description: z.string().max(150),
      confidence: z.number().min(30).max(100),
      radius_meters: z.number().min(100).max(5000),
      expires_hours: z.number().min(1).max(24),
      reasoning: z.string().max(300),
      weather_influence: z.string().max(150),
      urgency_level: z.enum(['low', 'medium', 'high', 'critical']),
      external_data_used: z.string().max(200).optional(),
      lat_offset: z.number().optional().default(0),
      lng_offset: z.number().optional().default(0)
    })
  )
})

export class EnhancedPredictiveEngine {
  /**
   * Generate weather-aware predictions with external data integration
   * Clusters nearby reports and analyzes them with real-time data
   */
  static async generateWeatherAwarePredictions(
    reports: EnhancedReportData[],
    country?: string
  ): Promise<PredictionResult[]> {
    if (reports.length < 1) return []

    // Calculate geographic center of all reports
    const centerLat = reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length
    const centerLng = reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length

    // Fetch all external data via API endpoint
    let externalData = {
      weather: null,
      airQuality: null,
      seismicRisk: null,
      disasters: null
    }

    try {
      const response = await fetch('/api/external-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: centerLat,
          lng: centerLng,
          country,
          action: 'all'
        })
      })

      if (response.ok) {
        const result = await response.json()
        externalData = result.data || externalData
      }
    } catch (error) {
      console.warn('Failed to fetch external data:', error)
      // Continue with fallback data
    }

    const externalContext = {
      weather: externalData.weather || {
        temperature: 20,
        humidity: 60,
        precipitation: 0,
        windSpeed: 5,
        conditions: 'clear',
        pressure: 1013,
        cloudCover: 0
      },
      airQuality: externalData.airQuality || {
        aqi: 2,
        pm25: 15,
        pm10: 30,
        no2: 0,
        o3: 0,
        so2: 0,
        co: 0
      },
      seismicRisk: externalData.seismicRisk || {
        recentEarthquakes: [],
        seismicityLevel: 'low',
        averageMagnitude: 0,
        eventCount: 0
      },
      disasters: externalData.disasters || {
        events: [],
        nearbyEvents: [],
        eventTypes: {}
      }
    }

    // Cluster reports by location (500m radius)
    const clusters = this.clusterReportsByLocation(reports, 500)

    const allPredictions: PredictionResult[] = []

    // Analyze each cluster with external data
    for (const cluster of clusters) {
      if (cluster.length >= 1) {
        const predictions = await this.analyzeClusterWithEnhancedAI(
          cluster,
          externalContext
        )
        allPredictions.push(...predictions)
      }
    }

    return allPredictions
  }

  /**
   * Analyze a cluster of reports using AI with external data context
   */
  private static async analyzeClusterWithEnhancedAI(
    cluster: EnhancedReportData[],
    context: any
  ): Promise<PredictionResult[]> {
    const clusterData = {
      report_count: cluster.length,
      geographic_center: {
        lat: cluster.reduce((sum, r) => sum + r.latitude, 0) / cluster.length,
        lng: cluster.reduce((sum, r) => sum + r.longitude, 0) / cluster.length
      },
      reports: cluster.map((r) => ({
        category: r.category,
        tags: r.tags,
        severity: r.severity_level,
        credibility: r.credibility_score,
        description: r.description,
        summary: r.ai_summary || r.description,
        timestamp: r.timestamp.toISOString()
      })),
      external_context: {
        weather: {
          temperature: context.weather.temperature,
          humidity: context.weather.humidity,
          precipitation: context.weather.precipitation,
          windSpeed: context.weather.windSpeed,
          windGusts: context.weather.windGusts,
          conditions: context.weather.conditions,
          pressure: context.weather.pressure,
          cloudCover: context.weather.cloudCover
        },
        airQuality: {
          aqi: context.airQuality.aqi,
          pm25: context.airQuality.pm25,
          pm10: context.airQuality.pm10,
          interpretation: `AQI Level ${context.airQuality.aqi}`
        },
        seismic: {
          seismicityLevel: context.seismicRisk.seismicityLevel,
          eventCount: context.seismicRisk.eventCount,
          averageMagnitude: context.seismicRisk.averageMagnitude
        },
        disasters: {
          nearbyEventCount: context.disasters.nearbyEvents?.length || 0,
          eventTypes: context.disasters.eventTypes
        }
      }
    }

    const systemPrompt = `You are Vigil's enhanced AI predictive hazard engine with real-time external data integration.

ANALYSIS CAPABILITIES:
- Real-time weather conditions (temperature, humidity, precipitation, wind)
- Air quality index and pollutant levels
- Seismic activity and earthquake risk
- Official disaster events and emergency data

ENHANCED PREDICTION LOGIC:
- FLOOD: High precipitation + high humidity + low elevation + drainage reports + recent rainfall
- FIRE: High temperature + low humidity + high wind speed + electrical reports + low air quality
- TRAFFIC: Severe weather + poor visibility + high wind + accident reports + crowded areas
- ENVIRONMENTAL: Poor air quality + chemical tags + wind direction + pollution sources
- ELECTRICAL: High humidity + lightning risk + power infrastructure + storm conditions
- MEDICAL: Air quality impacts + disease indicators + crowd density + temperature extremes
- EARTHQUAKE: Seismic activity detected + recent tremors + geological reports
- HAZMAT: Chemical tags + air quality + weather carrying pollutants + nearby disasters

EXTERNAL DATA INTEGRATION:
- Use weather data to boost confidence for weather-dependent hazards
- Consider air quality for health and environmental hazards
- Factor in seismic activity for earthquake predictions
- Cross-reference with official disaster data for validation
- Provide specific weather influence reasoning

GEOGRAPHIC DIVERSITY:
- SPREAD predictions across different locations within the cluster area, not all at the center
- Each prediction type should target different geographic zones when multiple reports exist
- Vary prediction locations to represent different risk zones
- Use report distribution to determine spatial spread (don't cluster all at one point)

Generate specific, actionable predictions with high confidence only when external data supports the reports.`

    const userPrompt = `Analyze this hazard cluster with real-time external data and generate specific predictions:

${JSON.stringify(clusterData, null, 2)}

IMPORTANT:
1. Only generate predictions if reports support them
2. Use external data to increase or decrease confidence
3. Be specific about which external data influenced each prediction
4. Consider cluster size and report severity in confidence scoring
5. For ${cluster.length} report(s), focus on high-confidence predictions

GEOGRAPHIC DISTRIBUTION:
- If multiple predictions, spread them across different locations using lat_offset and lng_offset
- Use small offsets (±0.01 to ±0.05 degrees) to spread predictions across the area
- Positive offsets go North/East, negative go South/West
- Each prediction type should target a different geographic zone when possible
- This ensures predictions appear at different locations on the map, not stacked at one point`

    try {
      const result = await generateObject({
        model: mistralClient('mistral-small-2503'),
        system: systemPrompt,
        prompt: userPrompt,
        schema: EnhancedPredictionSchema,
        temperature: 0.3
      })

      return result.object.predictions.map((pred) => ({
        id: `pred_${pred.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: pred.type as any,
        description: pred.description,
        confidence: Math.min(pred.confidence, 95), // Cap at 95% to account for uncertainty
        affected_area: {
          lat: clusterData.geographic_center.lat + (pred.lat_offset || 0),
          lng: clusterData.geographic_center.lng + (pred.lng_offset || 0),
          radius: pred.radius_meters
        },
        expires_at: new Date(Date.now() + pred.expires_hours * 60 * 60 * 1000),
        source_reports: cluster.map((r) => r.id),
        cluster_size: cluster.length,
        reasoning: pred.reasoning,
        weather_influence: pred.weather_influence,
        urgency_level: pred.urgency_level,
        external_context: context
      }))
    } catch (error) {
      console.error('Enhanced AI prediction failed:', error)
      return []
    }
  }

  /**
   * Cluster reports by geographic proximity (default 500m)
   * Small clusters for testing with limited data
   */
  private static clusterReportsByLocation(
    reports: EnhancedReportData[],
    maxDistance: number
  ): EnhancedReportData[][] {
    const clusters: EnhancedReportData[][] = []
    const processed = new Set<string>()

    for (const report of reports) {
      if (processed.has(report.id)) continue

      const cluster = [report]
      processed.add(report.id)

      // Find all nearby reports
      for (const otherReport of reports) {
        if (processed.has(otherReport.id)) continue

        const distance = calculateDistance(
          report.latitude,
          report.longitude,
          otherReport.latitude,
          otherReport.longitude
        )

        if (distance <= maxDistance) {
          cluster.push(otherReport)
          processed.add(otherReport.id)
        }
      }

      clusters.push(cluster)
    }

    return clusters
  }

  /**
   * Get prediction summary for display
   */
  static getPredictionSummary(predictions: PredictionResult[]): {
    totalPredictions: number
    highConfidence: number
    criticalUrgency: number
    byType: Record<string, number>
  } {
    return {
      totalPredictions: predictions.length,
      highConfidence: predictions.filter((p) => p.confidence >= 70).length,
      criticalUrgency: predictions.filter((p) => p.urgency_level === 'critical').length,
      byType: predictions.reduce(
        (acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    }
  }
}
