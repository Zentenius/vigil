/**
 * Utility calculations for geographic and predictive analysis
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
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
 * Calculate credibility score based on multiple factors
 * Returns score from 0-100
 */
export function calculateCredibilityScore(
  severity: number,
  tags: string[],
  description: string,
  isVerified: boolean = false
): number {
  let score = 50 // Base score

  // Severity contributes 20 points max
  score += (severity / 5) * 20

  // Tags contribute 10 points (more tags = more detail)
  score += Math.min(tags.length * 2, 10)

  // Description length contributes 10 points
  score += Math.min(description.length / 50, 10)

  // Verified status adds 10 points
  if (isVerified) score += 10

  return Math.min(score, 100)
}

/**
 * Calculate risk score for a prediction based on multiple factors
 * Returns score from 0-100
 */
export function calculateRiskScore(
  confidence: number,
  urgency: 'low' | 'medium' | 'high' | 'critical',
  clusterSize: number,
  externalDataSupport: number = 0.5 // 0-1 scale
): number {
  let risk = confidence * 0.5 // 50% from confidence

  // Urgency multiplier
  const urgencyMultiplier: Record<string, number> = {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    critical: 2.0
  }
  risk += (urgencyMultiplier[urgency] ?? 1.0) * 10

  // Cluster size (more reports = higher risk)
  risk += Math.min(clusterSize * 5, 15)

  // External data support
  risk += externalDataSupport * 15

  return Math.min(risk, 100)
}

/**
 * Determine urgency level based on confidence and cluster factors
 */
export function determineUrgency(
  confidence: number,
  clusterSize: number,
  severity: number
): 'low' | 'medium' | 'high' | 'critical' {
  const score = confidence * 0.5 + (clusterSize * 10) + (severity * 5)

  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Calculate geographic centroid of multiple points
 */
export function calculateCentroid(
  points: { lat: number; lng: number }[]
): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 0, lng: 0 }

  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length
  }
}

/**
 * Calculate radius needed to encompass all points in a cluster
 */
export function calculateClusterRadius(
  centroid: { lat: number; lng: number },
  points: { lat: number; lng: number }[]
): number {
  if (points.length === 0) return 100

  let maxDistance = 0
  for (const point of points) {
    const distance = calculateDistance(centroid.lat, centroid.lng, point.lat, point.lng)
    maxDistance = Math.max(maxDistance, distance)
  }

  // Add 20% buffer and convert km to meters
  return Math.ceil((maxDistance * 1.2) * 1000)
}

/**
 * Format prediction confidence as a percentage with color
 */
export function formatConfidence(confidence: number): {
  percentage: string
  color: string
  level: string
} {
  return {
    percentage: `${Math.round(confidence)}%`,
    color:
      confidence >= 80
        ? '#ef4444'
        : confidence >= 60
          ? '#f97316'
          : confidence >= 40
            ? '#eab308'
            : '#10b981',
    level:
      confidence >= 80
        ? 'Very High'
        : confidence >= 60
          ? 'High'
          : confidence >= 40
            ? 'Moderate'
            : 'Low'
  }
}
