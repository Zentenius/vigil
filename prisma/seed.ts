import {PrismaClient, ReportCategory, ReportStatus } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Base coordinates you provided (Jamaica)
  // Latitude: 18.008988 / N 18° 0' 32.355''
  // Longitude: -76.777986 / W 76° 46' 40.7
  const baseLatitude = 18.008988
  const baseLongitude = -76.777986
  
  // User IDs you provided
  const userIds = ['cmgwlsnhx00003pp0cuxkbnm6', 'cmgwj7b990000dinbpldbkr8s']
  
  // Deterministic nearby coordinates for reliable seeding during testing
  const nearbyPoints = [
    { lat: baseLatitude + 0.000100, lng: baseLongitude + 0.000050 }, // ~11m NE
    { lat: baseLatitude - 0.000120, lng: baseLongitude - 0.000030 }, // ~13m SW
    { lat: baseLatitude + 0.000200, lng: baseLongitude - 0.000080 }, // ~22m NNW
    { lat: baseLatitude - 0.000220, lng: baseLongitude + 0.000120 }, // ~24m SSE
    { lat: baseLatitude + 0.000050, lng: baseLongitude + 0.000200 }, // ~5m NE
  ]
  
  // Sample report data
  const reportData: { location_name: string; category: ReportCategory; tags: string[]; severity_level: number; description: string }[] = [
    {
      location_name: "Kingston Harbor",
      category: "ENVIRONMENTAL",
      tags: ["water", "pollution", "marine"],
      severity_level: 3,
      description: "Oil spill detected in Kingston Harbor affecting marine life"
    },
    {
      location_name: "Half Way Tree Road",
      category: "INFRASTRUCTURE",
      tags: ["road", "pothole", "traffic"],
      severity_level: 2,
      description: "Large pothole causing traffic delays on Half Way Tree Road"
    },
    {
      location_name: "Emancipation Park",
      category: "HAZARD",
      tags: ["park", "lighting", "safety"],
      severity_level: 2,
      description: "Broken streetlights creating unsafe conditions in the park"
    },
    {
      location_name: "Spanish Town Road",
      category: "EMERGENCY",
      tags: ["fire", "building", "evacuation"],
      severity_level: 5,
      description: "Building fire spreading rapidly, emergency response needed"
    },
    {
      location_name: "Hope Gardens",
      category: "ENVIRONMENTAL",
      tags: ["tree", "fallen", "blocked"],
      severity_level: 3,
      description: "Large tree fallen across main pathway after storm"
    },
    {
      location_name: "Mandela Highway",
      category: "INFRASTRUCTURE",
      tags: ["highway", "accident", "debris"],
      severity_level: 4,
      description: "Vehicle accident with debris blocking two lanes"
    },
    {
      location_name: "New Kingston",
      category: "HAZARD",
      tags: ["gas", "leak", "evacuation"],
      severity_level: 4,
      description: "Gas leak reported near commercial building, area being evacuated"
    },
    {
      location_name: "Blue Mountain Trail",
      category: "OTHER",
      tags: ["hiking", "trail", "closed"],
      severity_level: 1,
      description: "Trail maintenance work blocking access to popular hiking route"
    },
    {
      location_name: "Coronation Market",
      category: "INFRASTRUCTURE",
      tags: ["market", "flooding", "drainage"],
      severity_level: 3,
      description: "Flooding in market area due to blocked drainage system"
    },
    {
      location_name: "Norman Manley International Airport",
      category: "EMERGENCY",
      tags: ["airport", "security", "incident"],
      severity_level: 4,
      description: "Security incident causing flight delays and passenger screening"
    },
    {
      location_name: "University of the West Indies",
      category: "INFRASTRUCTURE",
      tags: ["university", "power", "outage"],
      severity_level: 2,
      description: "Power outage affecting multiple buildings on campus"
    },
    {
      location_name: "Port Royal",
      category: "ENVIRONMENTAL",
      tags: ["coastal", "erosion", "flooding"],
      severity_level: 3,
      description: "Coastal erosion threatening historic buildings and infrastructure"
    },
    {
      location_name: "Papine Square",
      category: "HAZARD",
      tags: ["sinkhole", "road", "danger"],
      severity_level: 4,
      description: "Large sinkhole opened in parking area, immediate danger to vehicles"
    },
    {
      location_name: "Liguanea",
      category: "OTHER",
      tags: ["water", "shortage", "supply"],
      severity_level: 2,
      description: "Water supply disruption affecting residential area"
    },
    {
      location_name: "Cross Roads",
      category: "INFRASTRUCTURE",
      tags: ["intersection", "traffic", "lights"],
      severity_level: 3,
      description: "Traffic light malfunction causing major intersection congestion"
    }
  ]
  
  console.log('🌱 Starting to seed reports...')
  
  // Create reports using nearby deterministic coordinates in rotation to ensure predictable test data
  let idx = 0
  for (const report of reportData) {
    const coordinates = nearbyPoints[idx % nearbyPoints.length]!
    idx += 1
    const randomUserId = userIds[idx % userIds.length]
    
    const createdReport = await db.report.create({
      data: {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        location_name: report.location_name,
        category: report.category,
        tags: report.tags,
        severity_level: report.severity_level,
        description: report.description,
        status: ReportStatus.ACTIVE,
        userId: randomUserId!,
      },
    })
    
    console.log(`✅ Created report: ${createdReport.location_name} at (${coordinates.lat}, ${coordinates.lng})`)
  }
  
  console.log('🎉 Seeding completed!')
  
  // Display summary
  const totalReports = await db.report.count()
  console.log(`📊 Total reports in database: ${totalReports}`)
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })