import { NextResponse } from 'next/server'
import { db } from '~/server/db'
import { EnhancedPredictiveEngine } from '~/lib/enhancedPredictiveEngine'
import type { EnhancedReportData } from '~/lib/enhancedPredictiveEngine'
import { calculateDistance } from '~/utils/calculations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/predictions/nearby?lat=X&lng=Y&radius=5000
 * 
 * Generates AI predictions for a specific area
 * Returns creative blob-based prediction visualization data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const lat = parseFloat(searchParams.get('lat') || '18.009025')
    const lng = parseFloat(searchParams.get('lng') || '-76.777948')
    const radius = parseFloat(searchParams.get('radius') || '5000') // in meters
    const country = searchParams.get('country') || undefined

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Fetch all reports from the database
    const allReports = await db.report.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Filter reports within the radius
    const nearbyReports = allReports.filter((report: any) => {
      const distance = calculateDistance(
        lat,
        lng,
        report.latitude,
        report.longitude
      )
      return distance * 1000 <= radius // Convert km to meters
    })

    if (nearbyReports.length === 0) {
      return NextResponse.json({
        predictions: [],
        metadata: {
          reportCount: 0,
          searchRadius: radius,
          center: { lat, lng },
          message: 'No reports in this area for predictions'
        }
      })
    }

    // Transform reports to engine format
    const enhancedReports: EnhancedReportData[] = nearbyReports.map((report: any) => ({
      id: report.id,
      latitude: report.latitude,
      longitude: report.longitude,
      category: report.category,
      tags: report.tags || [],
      severity_level: report.severity_level,
      timestamp: report.createdAt,
      description: report.description,
      credibility_score: 0.7, // Default credibility
      status: 'active',
      user: report.user,
      ai_summary: report.description
    }))

    // Generate predictions using enhanced engine
    const predictions = await EnhancedPredictiveEngine.generateWeatherAwarePredictions(
      enhancedReports,
      country
    )

    return NextResponse.json({
      predictions,
      metadata: {
        reportCount: nearbyReports.length,
        predictionCount: predictions.length,
        searchRadius: radius,
        center: { lat, lng },
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Predictions API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/predictions/regenerate
 * 
 * Manually trigger prediction regeneration for current location
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lat, lng, radius = 5000, country } = body

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Location (lat, lng) is required' },
        { status: 400 }
      )
    }

    // Fetch reports
    const allReports = await db.report.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Filter by radius
    const nearbyReports = allReports.filter((report: any) => {
      const distance = calculateDistance(lat, lng, report.latitude, report.longitude)
      return distance * 1000 <= radius
    })

    // Transform and predict
    const enhancedReports: EnhancedReportData[] = nearbyReports.map((report: any) => ({
      id: report.id,
      latitude: report.latitude,
      longitude: report.longitude,
      category: report.category,
      tags: report.tags || [],
      severity_level: report.severity_level,
      timestamp: report.createdAt,
      description: report.description,
      credibility_score: 0.7,
      status: 'active',
      user: report.user,
      ai_summary: report.description
    }))

    const predictions = await EnhancedPredictiveEngine.generateWeatherAwarePredictions(
      enhancedReports,
      country
    )

    return NextResponse.json({
      predictions,
      metadata: {
        reportCount: nearbyReports.length,
        predictionCount: predictions.length,
        searchRadius: radius,
        center: { lat, lng },
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Prediction Regeneration Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to regenerate predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
