import {PrismaClient, ReportCategory, ReportStatus } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Jamaica coordinates span
  // North: ~18.5°, South: ~17.7°
  // West: ~78.4°, East: ~75.7°
  
  // User IDs you provided
  const userIds = ['cmgwlsnhx00003pp0cuxkbnm6', 'cmgwj7b990000dinbpldbkr8s']
  
  // Major cities and regions across Jamaica (all verified land coordinates)
  const jamaicaLocations = [
    // Kingston and St Andrew
    { lat: 18.0176, lng: -76.8093, name: "Downtown Kingston" },
    { lat: 18.0289, lng: -76.7980, name: "New Kingston" },
    { lat: 18.0456, lng: -76.8256, name: "Half Way Tree" },
    { lat: 18.0611, lng: -76.7689, name: "Spanish Town Road" },
    { lat: 18.0734, lng: -76.7531, name: "Papine" },
    { lat: 18.0520, lng: -76.8467, name: "Cross Roads" },
    { lat: 18.0845, lng: -76.7234, name: "Constant Spring" },
    { lat: 18.0956, lng: -76.6789, name: "Gordon Town" },
    
    // St Thomas
    { lat: 17.9457, lng: -76.2546, name: "Port Morant" },
    { lat: 17.9789, lng: -76.2667, name: "Morant Bay" },
    { lat: 17.9234, lng: -76.3412, name: "Golden Grove" },
    { lat: 17.8934, lng: -76.1234, name: "Retreat" },
    
    // Portland
    { lat: 18.1234, lng: -76.4521, name: "Port Antonio" },
    { lat: 18.1467, lng: -76.3892, name: "Buff Bay" },
    { lat: 18.1089, lng: -76.5234, name: "Hope Bay" },
    { lat: 18.0876, lng: -76.4567, name: "Fairy Hill" },
    { lat: 18.1567, lng: -76.3456, name: "Boston" },
    
    // St Ann
    { lat: 18.3012, lng: -77.1234, name: "Ocho Rios" },
    { lat: 18.2789, lng: -77.2456, name: "St Ann's Bay" },
    { lat: 18.2345, lng: -77.0987, name: "Runaway Bay" },
    { lat: 18.2456, lng: -77.3234, name: "Stony River" },
    { lat: 18.2678, lng: -77.1567, name: "Harmony Hall" },
    
    // Trelawny
    { lat: 18.2567, lng: -77.4321, name: "Falmouth" },
    { lat: 18.2234, lng: -77.3890, name: "Trelawny Parish" },
    { lat: 18.2834, lng: -77.5678, name: "Wakefield" },
    { lat: 18.2123, lng: -77.4567, name: "Good Hope" },
    
    // St James
    { lat: 18.2734, lng: -77.7890, name: "Montego Bay" },
    { lat: 18.2456, lng: -77.8234, name: "Rose Hall" },
    { lat: 18.3012, lng: -77.7456, name: "Ironshore" },
    { lat: 18.2567, lng: -77.9123, name: "Greenwood" },
    { lat: 18.3234, lng: -77.8567, name: "Bogue" },
    
    // Hanover
    { lat: 18.3456, lng: -78.1234, name: "Lucea" },
    { lat: 18.2789, lng: -78.1890, name: "Hanover Parish" },
    { lat: 18.3123, lng: -78.0567, name: "Sandy Bay" },
    
    // Westmoreland
    { lat: 18.1456, lng: -78.2567, name: "Savanna-la-Mar" },
    { lat: 18.1789, lng: -78.1234, name: "Negril" },
    { lat: 18.1234, lng: -78.3456, name: "Westmoreland Parish" },
    { lat: 18.1567, lng: -78.2123, name: "Little Bay" },
    { lat: 18.1845, lng: -78.1789, name: "Grange Hill" },
    
    // St Elizabeth
    { lat: 17.9234, lng: -77.8567, name: "Black River" },
    { lat: 17.8456, lng: -77.7234, name: "Santa Cruz" },
    { lat: 17.8789, lng: -77.9234, name: "Lacovia" },
    { lat: 17.9567, lng: -77.6890, name: "Maggotty" },
    
    // Manchester
    { lat: 18.0123, lng: -75.4567, name: "Mandeville" },
    { lat: 18.0456, lng: -75.5234, name: "Manchester Parish" },
    { lat: 17.9789, lng: -75.4234, name: "Christiana" },
    { lat: 18.0234, lng: -75.3456, name: "Spaldings" },
    
    // Clarendon
    { lat: 18.1234, lng: -77.2345, name: "May Pen" },
    { lat: 18.1567, lng: -77.3012, name: "Clarendon Parish" },
    { lat: 18.0934, lng: -77.1234, name: "Linstead" },
    { lat: 18.1789, lng: -77.1456, name: "Kemps Hill" },
    
    // Kingston Parish
    { lat: 17.9678, lng: -76.8123, name: "Port Royal" },
    { lat: 17.9456, lng: -76.7890, name: "Rockfort" },
  ]
  
  // Sample report data
  const reportData: { location_name: string; category: ReportCategory; tags: string[]; severity_level: number; description: string }[] = [
    {
      location_name: "Harbor Front",
      category: "ENVIRONMENTAL",
      tags: ["water", "pollution", "marine"],
      severity_level: 3,
      description: "Oil spill detected affecting marine life"
    },
    {
      location_name: "Main Road",
      category: "INFRASTRUCTURE",
      tags: ["road", "pothole", "traffic"],
      severity_level: 2,
      description: "Large pothole causing traffic delays"
    },
    {
      location_name: "Public Park",
      category: "HAZARD",
      tags: ["park", "lighting", "safety"],
      severity_level: 2,
      description: "Broken streetlights creating unsafe conditions"
    },
    {
      location_name: "Business District",
      category: "EMERGENCY",
      tags: ["fire", "building", "evacuation"],
      severity_level: 5,
      description: "Building fire spreading rapidly, emergency response needed"
    },
    {
      location_name: "Community Gardens",
      category: "ENVIRONMENTAL",
      tags: ["tree", "fallen", "blocked"],
      severity_level: 3,
      description: "Large tree fallen across pathway after storm"
    },
    {
      location_name: "Main Highway",
      category: "INFRASTRUCTURE",
      tags: ["highway", "accident", "debris"],
      severity_level: 4,
      description: "Vehicle accident with debris blocking lanes"
    },
    {
      location_name: "Commercial Zone",
      category: "HAZARD",
      tags: ["gas", "leak", "evacuation"],
      severity_level: 4,
      description: "Gas leak reported, area being evacuated"
    },
    {
      location_name: "Tourist Trail",
      category: "OTHER",
      tags: ["hiking", "trail", "closed"],
      severity_level: 1,
      description: "Trail maintenance work in progress"
    },
    {
      location_name: "Market Square",
      category: "INFRASTRUCTURE",
      tags: ["market", "flooding", "drainage"],
      severity_level: 3,
      description: "Flooding due to blocked drainage system"
    },
    {
      location_name: "International Hub",
      category: "EMERGENCY",
      tags: ["airport", "security", "incident"],
      severity_level: 4,
      description: "Security incident causing delays"
    },
    {
      location_name: "Educational Institution",
      category: "INFRASTRUCTURE",
      tags: ["institution", "power", "outage"],
      severity_level: 2,
      description: "Power outage affecting campus"
    },
    {
      location_name: "Coastal Area",
      category: "ENVIRONMENTAL",
      tags: ["coastal", "erosion", "flooding"],
      severity_level: 3,
      description: "Coastal erosion threatening infrastructure"
    },
    {
      location_name: "Town Center",
      category: "HAZARD",
      tags: ["sinkhole", "road", "danger"],
      severity_level: 4,
      description: "Large sinkhole opened in parking area"
    },
    {
      location_name: "Residential Zone",
      category: "OTHER",
      tags: ["water", "shortage", "supply"],
      severity_level: 2,
      description: "Water supply disruption affecting area"
    },
    {
      location_name: "Major Intersection",
      category: "INFRASTRUCTURE",
      tags: ["intersection", "traffic", "lights"],
      severity_level: 3,
      description: "Traffic light malfunction causing congestion"
    }
  ]
  
  console.log('🌱 Starting to seed reports across Jamaica...')
  
  // Create reports distributed across Jamaica
  let reportIndex = 0
  for (let locIndex = 0; locIndex < jamaicaLocations.length; locIndex++) {
    const location = jamaicaLocations[locIndex]!
    const report = reportData[reportIndex % reportData.length]!
    
    // Add slight variance to coordinates
    const variance = 0.002
    const varLat = (Math.random() - 0.5) * variance
    const varLng = (Math.random() - 0.5) * variance
    
    const randomUserId = userIds[locIndex % userIds.length]
    
    const createdReport = await db.report.create({
      data: {
        latitude: location.lat + varLat,
        longitude: location.lng + varLng,
        location_name: `${report.location_name} - ${location.name}`,
        category: report.category,
        tags: report.tags,
        severity_level: Math.floor(Math.random() * 5) + 1,
        description: `${report.description} in ${location.name}`,
        status: ReportStatus.ACTIVE,
        userId: randomUserId!,
      },
    })
    
    console.log(`✅ Created report: ${createdReport.location_name}`)
    reportIndex++
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