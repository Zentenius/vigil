import { createMistral, mistral } from '@ai-sdk/mistral'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { db } from '~/server/db'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const mistralClient = createMistral({
  apiKey: "olsuUo4qXzJcslHcWj66TtoM8lTdwqDm"
})

// Tool 1: Get current hazard reports
export const getCurrentHazards = tool({
  description: 'Get active hazard reports from the community system',
  inputSchema: z.object({
    category: z.string().optional().describe('Filter by hazard category (EMERGENCY, HAZARD, INFRASTRUCTURE, ENVIRONMENTAL, OTHER)'),
    limit: z.number().optional().default(20).describe('Maximum number of reports to return'),
  }),
  execute: async ({ category, limit = 20 }) => {
    const reports = await db.report.findMany({
      where: {
        status: 'ACTIVE',
        ...(category ? { category: category as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true, email: true } } }
    })
    
    return {
      totalActive: reports.length,
      reports: reports.map((r: any) => ({
        id: r.id,
        category: r.category,
        severity: r.severity_level,
        location_name: r.location_name,
        description: r.description,
        status: r.status,
        latitude: r.latitude,
        longitude: r.longitude,
        reportedAt: r.createdAt,
        reportedBy: r.user?.name || r.user?.email || 'Unknown',
      })),
    }
  },
})

// Tool 2: Get weather data using Open-Meteo
export const getWeatherData = tool({
  description: 'Get current weather for Jamaica locations. Useful for flood, storm, and weather-related hazards.',
  inputSchema: z.object({
    latitude: z.number().optional().default(18.1096).describe('Latitude (default Jamaica center)'),
    longitude: z.number().optional().default(-77.2975).describe('Longitude (default Jamaica center)'),
  }),
  execute: async ({ latitude = 18.1096, longitude = -77.2975 }) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&temperature_unit=celsius&wind_speed_unit=kmh`
      )
      
      if (!response.ok) throw new Error('Weather API failed')
      
      const data = await response.json()
      const current = data.current
      
      return {
        location: { latitude, longitude },
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        conditions: getWeatherDescription(current.weather_code),
        timestamp: current.time,
      }
    } catch (error) {
      return { 
        error: 'Failed to fetch weather data',
        location: { latitude, longitude }
      }
    }
  },
})

// Tool 3: Get seismic activity
export const getSeismicActivity = tool({
  description: 'Check recent earthquake activity near Jamaica. Critical for landslide and infrastructure hazard assessment.',
  inputSchema: z.object({
    days: z.number().optional().default(7).describe('Number of days to look back'),
  }),
  execute: async ({ days = 7 }) => {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const response = await fetch(
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&latitude=18.1096&longitude=-77.2975&maxradiuskm=500`
      )
      
      if (!response.ok) throw new Error('USGS API failed')
      
      const data = await response.json()
      const significant = (data.features || []).filter((f: any) => f.properties.mag > 4.0)
      
      return {
        recentQuakes: data.features?.length || 0,
        significant: significant.length,
        latest: data.features?.[0] ? {
          magnitude: data.features[0].properties.mag,
          location: data.features[0].properties.place,
          depth: data.features[0].geometry.coordinates[2],
          time: new Date(data.features[0].properties.time).toLocaleString(),
        } : null,
      }
    } catch (error) {
      return { error: 'Failed to fetch seismic data' }
    }
  },
})

// Tool 4: Analyze hazard trends
export const analyzeHazardTrends = tool({
  description: 'Analyze trends in hazard reports over time periods',
  inputSchema: z.object({
    days: z.number().optional().default(7).describe('Number of days to analyze'),
  }),
  execute: async ({ days = 7 }) => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const reports = await db.report.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    })
    
    const byCategory = reports.reduce((acc: Record<string, number>, r: any) => {
      acc[r.category] = (acc[r.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byStatus = reports.reduce((acc: Record<string, number>, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const bySeverity = reports.reduce((acc: Record<number, number>, r: any) => {
      const level = r.severity_level
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    return {
      period: `${days} days`,
      totalReports: reports.length,
      byCategory,
      byStatus,
      bySeverity,
    }
  },
})

// Helper function for weather description
function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  }
  return descriptions[code] || 'Unknown'
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    console.log("📝 Risk Advisor request received:", {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100) + "...",
    })

    // Get the latest user message to determine analysis needs
    const latestMessage = messages[messages.length - 1]
    const userQuery = latestMessage?.content || ""

    // Check what kind of analysis is requested
    const isHazardQuery = /\b(hazards?|emergency|danger|risks?|threat|alert|active|report)\b/i.test(userQuery)
    const isTrendQuery = /\b(trends?|patterns?|history|comparison|overview|analysis)\b/i.test(userQuery)

    console.log("🔍 Query analysis:", { 
      isHazardQuery, 
      isTrendQuery,
      userQuery: userQuery.substring(0, 100) + "..." 
    })

    // Fetch real data from database
    let contextData = ""
    
    if (isHazardQuery) {
      try {
        const activeReports = await db.report.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { name: true } } }
        })

        if (activeReports.length > 0) {
          const categoryCounts = activeReports.reduce((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          const severityBreakdown = activeReports.reduce((acc, r) => {
            const level = r.severity_level
            if (!acc[level]) acc[level] = []
            acc[level].push(r.category)
            return acc
          }, {} as Record<number, string[]>)

          const reportsText = activeReports.map((r) => 
            `- ${r.category} (Severity: ${r.severity_level}/10) in ${r.location_name || 'Unknown location'}: ${r.description.substring(0, 50)}...`
          ).join('\n')

          contextData = `ACTIVE HAZARD REPORTS FROM DATABASE (${activeReports.length} total):
Category breakdown: ${Object.entries(categoryCounts).map(([cat, count]) => `${cat}: ${count}`).join(', ')}
Severity distribution: ${Object.entries(severityBreakdown).map(([level, cats]) => `Level ${level}: ${cats.length} reports`).join(', ')}

Recent reports:
${reportsText}

IMPORTANT: Use these REAL reports to inform your analysis. Provide specific locations and hazard types from this data.`
        } else {
          contextData = "No active hazard reports in the database currently."
        }
        
        console.log("� Database context loaded:", { reportCount: activeReports.length })
      } catch (dbError) {
        console.error("⚠️ Database query failed:", dbError)
        contextData = "Unable to fetch database reports at this moment."
      }
    }

    if (isTrendQuery) {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const recentReports = await db.report.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
        })

        const categoryTrends = recentReports.reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        contextData = `HAZARD TRENDS (Last 7 days):
Total reports: ${recentReports.length}
By category: ${Object.entries(categoryTrends).map(([cat, count]) => `${cat}: ${count}`).join(', ')}`
        
        console.log("📈 Trend data loaded:", { reportCount: recentReports.length })
      } catch (dbError) {
        console.error("⚠️ Trend query failed:", dbError)
      }
    }

    const systemPrompt = `You are Vigil's AI Risk Advisor for Jamaica's community hazard reporting system.

Your role is to analyze REAL hazard data from the community database and provide clear, actionable guidance.

${contextData ? `\n🗂️ CURRENT DATABASE CONTEXT:\n${contextData}\n` : ''}

About Jamaica:
- 14 parishes with diverse geography (coastal, mountainous, urban areas)
- Hurricane season: June-November (peak: August-October)
- Common hazards: Flooding, landslides, earthquakes, traffic incidents, infrastructure failures
- Emergency number: 119

Response Guidelines:
- ALWAYS reference specific data from the database context above (locations, categories, counts)
- Be concise and action-oriented (keep responses to 2-3 sentences)
- Prioritize life safety over property
- Use specific numbers and location data when available
- Provide numbered action steps (max 3) when recommending actions
- Flag urgent/critical situations immediately with ⚠️ or 🚨
- Always maintain a professional, urgent tone focused on community safety
- Link your recommendations directly to the real hazard data provided

Example: "We have 5 active EMERGENCY flooding reports in Kingston and Spanish Town. ACTIONS: 1) Issue flood warnings to affected areas 2) Position rescue teams 3) Open emergency shelters."`

    const result = streamText({
      model: mistral('mistral-small-2503'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    })

    console.log("✅ Stream created successfully");
    return result.toTextStreamResponse()
  } catch (error) {
    console.error("❌ Risk Advisor error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
