"use client"

import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Skeleton } from "~/components/ui/skeleton"
import { AlertTriangle, RefreshCw, Zap, TrendingUp } from "lucide-react"
import type { PredictionResult, EnhancedReportData } from "~/lib/enhancedPredictiveEngine"
import { EnhancedPredictiveEngine } from "~/lib/enhancedPredictiveEngine"

export default function PredictionsTestPage() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [reportCount, setReportCount] = useState(0)

  const loadPredictions = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all reports from the API
      const response = await fetch("/api/report")
      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }

      const reports = await response.json()
      setReportCount(reports.length)

      if (reports.length === 0) {
        setError("No reports available. Submit some reports first to generate predictions.")
        setPredictions([])
        setLoading(false)
        return
      }

      // Transform reports to EnhancedReportData format
      const enhancedReports: EnhancedReportData[] = reports.map((report: any) => ({
        id: report.id,
        latitude: report.latitude,
        longitude: report.longitude,
        category: report.category,
        tags: report.tags || [],
        severity_level: report.severity_level,
        timestamp: new Date(report.createdAt),
        description: report.description,
        credibility_score: 75, // Default score
        status: "active",
        user: report.user
      }))

      // Generate predictions
      const result = await EnhancedPredictiveEngine.generateWeatherAwarePredictions(
        enhancedReports,
        "Jamaica" // Default country
      )

      setPredictions(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error loading predictions:", err)
      setError(err instanceof Error ? err.message : "Failed to load predictions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load predictions on mount
    loadPredictions()
  }, [])

  const summary = EnhancedPredictiveEngine.getPredictionSummary(predictions)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-red-500/20 text-red-700 border-red-200"
    if (confidence >= 60) return "bg-orange-500/20 text-orange-700 border-orange-200"
    if (confidence >= 40) return "bg-yellow-500/20 text-yellow-700 border-yellow-200"
    return "bg-green-500/20 text-green-700 border-green-200"
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "high":
        return <Zap className="w-4 h-4 text-orange-500" />
      case "medium":
        return <TrendingUp className="w-4 h-4 text-yellow-500" />
      default:
        return <TrendingUp className="w-4 h-4 text-green-500" />
    }
  }

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      flood: "bg-blue-500/20 text-blue-700",
      fire: "bg-red-500/20 text-red-700",
      traffic: "bg-yellow-500/20 text-yellow-700",
      environmental: "bg-green-500/20 text-green-700",
      electrical: "bg-purple-500/20 text-purple-700",
      medical: "bg-pink-500/20 text-pink-700",
      earthquake: "bg-orange-500/20 text-orange-700",
      hazmat: "bg-red-500/20 text-red-700"
    }
    return colors[type] || "bg-gray-500/20 text-gray-700"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🧠 Prediction Engine Test</h1>
          <p className="text-slate-400">
            Real-time hazard predictions with external data integration
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Controls</CardTitle>
            <CardDescription>
              {reportCount > 0
                ? `Using ${reportCount} report(s) for prediction`
                : "No reports available"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={loadPredictions}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Predictions...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Predictions
                </>
              )}
            </Button>
            {lastUpdated && (
              <p className="text-sm text-slate-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-500/10 border-red-500/50">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {predictions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-white">{summary.totalPredictions}</div>
                <p className="text-slate-400 text-sm">Total Predictions</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-400">{summary.highConfidence}</div>
                <p className="text-slate-400 text-sm">High Confidence (70%+)</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-400">{summary.criticalUrgency}</div>
                <p className="text-slate-400 text-sm">Critical Urgency</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-lg font-semibold text-teal-400">
                  {Object.entries(summary.byType)
                    .map(([type]) => type)
                    .join(", ") || "None"}
                </div>
                <p className="text-slate-400 text-sm">Hazard Types</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <Skeleton className="h-32 bg-slate-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Predictions Grid */}
        {!loading && predictions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">🔮 Generated Predictions</h2>
            {predictions.map((prediction) => (
              <Card
                key={prediction.id}
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header with Type and Urgency */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getTypeColor(prediction.type)}>
                          {prediction.type.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {getUrgencyIcon(prediction.urgency_level)}
                          <span className="text-sm font-medium capitalize text-slate-300">
                            {prediction.urgency_level} Priority
                          </span>
                        </div>
                      </div>
                      <Badge className={getConfidenceColor(prediction.confidence)}>
                        {Math.round(prediction.confidence)}% Confidence
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-slate-300">{prediction.description}</p>

                    {/* Location Info */}
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <p className="text-sm text-slate-400">
                        <span className="font-semibold">📍 Location:</span> {prediction.affected_area.lat.toFixed(4)},
                        {prediction.affected_area.lng.toFixed(4)} (
                        {(prediction.affected_area.radius / 1000).toFixed(1)}km radius)
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        <span className="font-semibold">⏱️ Expires:</span>{" "}
                        {prediction.expires_at.toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Reasoning */}
                    <div className="bg-slate-700/30 rounded-lg p-3 border-l-2 border-teal-500">
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                        Reasoning
                      </p>
                      <p className="text-sm text-slate-300 mt-1">{prediction.reasoning}</p>
                    </div>

                    {/* Weather Influence */}
                    <div className="bg-slate-700/30 rounded-lg p-3 border-l-2 border-blue-500">
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                        Weather Influence
                      </p>
                      <p className="text-sm text-slate-300 mt-1">{prediction.weather_influence}</p>
                    </div>

                    {/* Cluster Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/50 rounded p-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                          Source Reports
                        </p>
                        <p className="text-lg font-bold text-teal-400">{prediction.cluster_size}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                          Expires In
                        </p>
                        <p className="text-lg font-bold text-slate-300">
                          {Math.round(
                            (prediction.expires_at.getTime() - new Date().getTime()) / (60 * 1000)
                          )}{" "}
                          min
                        </p>
                      </div>
                    </div>

                    {/* External Data Used */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        🌤️ Weather Data
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        💨 Air Quality
                      </Badge>
                      {prediction.external_context.seismicRisk?.eventCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          🌍 Seismic Data
                        </Badge>
                      )}
                      {prediction.external_context.disasters?.nearbyEvents?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          📡 Disaster Data
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && predictions.length === 0 && !error && (
          <Card className="bg-slate-800 border-slate-700 text-center py-12">
            <CardContent>
              <p className="text-slate-400 mb-4">No predictions generated yet.</p>
              <Button onClick={loadPredictions} className="bg-teal-600 hover:bg-teal-700 text-white">
                Generate Predictions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
