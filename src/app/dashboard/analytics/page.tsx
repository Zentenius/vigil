"use client"

import { AppSidebar } from "~/components/app-sidebar"
import { BreadcrumbPath } from "~/components/breadcrumb-path"
import { Separator } from "~/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Switch } from "~/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { Download, ChevronDown, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import * as XLSX from "xlsx"
import { InteractiveMap } from "~/components/ui/interactive-map"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.Map })), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>
})
const MapLayers = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapLayers })), { ssr: false })
const MapLayersControl = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapLayersControl })), { ssr: false })
const MapTileLayer = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapTileLayer })), { ssr: false })
const MapZoomControl = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapZoomControl })), { ssr: false })
const PredictiveLayer = dynamic(() => import("~/components/ui/predictive-layer").then(mod => ({ default: mod.PredictiveLayer })), { 
  ssr: false 
})

interface Report {
  id: string
  latitude: number
  longitude: number
  location_name: string | null
  category: string
  tags: string[]
  severity_level: number
  description: string
  createdAt: string
  user?: {
    name: string | null
    email: string | null
  }
}

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<30 | 7 | 3 | 1>(30)
  const [activeFilter, setActiveFilter] = useState<"all" | "critical" | "moderate" | "minor">("all")
  const [showOnlyCritical, setShowOnlyCritical] = useState(false)
  const [hideResolved, setHideResolved] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch reports from database
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/report")
        if (response.ok) {
          const data = await response.json()
          setReports(data)
          generateChartData(data, timePeriod)
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [timePeriod])

  // Fetch predictions from API
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch("/api/predictions/nearby?lat=18.009025&lng=-76.777948&radius=10000")
        if (response.ok) {
          const data = await response.json()
          setPredictions(data.predictions || [])
        }
      } catch (error) {
        console.error("Failed to fetch predictions:", error)
      }
    }

    fetchPredictions()
  }, [])

  const getSeverityType = (severity: number): "critical" | "moderate" | "minor" => {
    if (severity >= 4) return "critical"
    if (severity >= 2) return "moderate"
    return "minor"
  }

  const generateChartData = (reportsData: Report[], days: number) => {
    const data: { [key: string]: { critical: number; moderate: number; minor: number; all: number } } = {}
    const now = new Date()

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      data[dateKey] = { critical: 0, moderate: 0, minor: 0, all: 0 }
    }

    // Group reports by date and severity
    reportsData.forEach((report) => {
      const reportDate = new Date(report.createdAt)
      const dateDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))

      if (dateDiff < days) {
        const dateKey = reportDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        const dayData = data[dateKey]
        if (dayData) {
          const severity = getSeverityType(report.severity_level)
          ;(dayData as any)[severity]++
          dayData.all++
        }
      }
    })

    // Convert to array
    const chartArray = Object.entries(data).map(([date, values]) => ({
      date,
      ...values,
    }))

    setChartData(chartArray)
  }

  const handleExport = () => {
    // Prepare data for export
    const exportData = chartData.map((item) => ({
      Date: item.date,
      Critical: item.critical,
      Moderate: item.moderate,
      Minor: item.minor,
      "All Hazards": item.all,
    }))

    // Add summary statistics
    const summary = {
      Date: "SUMMARY",
      Critical: chartData.reduce((sum: number, item: any) => sum + item.critical, 0),
      Moderate: chartData.reduce((sum: number, item: any) => sum + item.moderate, 0),
      Minor: chartData.reduce((sum: number, item: any) => sum + item.minor, 0),
      "All Hazards": chartData.reduce((sum: number, item: any) => sum + item.all, 0),
    }

    exportData.push(summary)

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Hazard Statistics")

    // Add known locations sheet
    const locationsData = getKnownLocations().map((loc) => ({
      Location: loc.location_name,
      Type: loc.category,
      Severity: getSeverityType(loc.severity_level),
      "Last Reported": getTimeAgo(loc.createdAt),
    }))
    const ws2 = XLSX.utils.json_to_sheet(locationsData)
    XLSX.utils.book_append_sheet(wb, ws2, "Known Locations")

    // Download file
    XLSX.writeFile(wb, `hazard-statistics-${timePeriod}days.xlsx`)
  }

  const getChartData = () => {
    switch (activeFilter) {
      case "critical":
        return { dataKey: "critical", color: "hsl(var(--vigil-critical))" }
      case "moderate":
        return { dataKey: "moderate", color: "hsl(var(--vigil-moderate))" }
      case "minor":
        return { dataKey: "minor", color: "hsl(var(--vigil-safe))" }
      default:
        return { dataKey: "all", color: "hsl(var(--vigil-teal))" }
    }
  }

  const getKnownLocations = (): Report[] => {
    const locationsMap = new Map<string, Report>()

    reports.forEach((report) => {
      if (report.location_name) {
        if (!locationsMap.has(report.location_name) || new Date(report.createdAt) > new Date(locationsMap.get(report.location_name)!.createdAt)) {
          locationsMap.set(report.location_name, report)
        }
      }
    })

    return Array.from(locationsMap.values()).slice(0, 5) as Report[]
  }

  const getTimeAgo = (date: string): string => {
    const now = new Date()
    const reportDate = new Date(date)
    const seconds = Math.floor((now.getTime() - reportDate.getTime()) / 1000)

    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const chartConfig = getChartData()
  const knownLocations = getKnownLocations()
  const stats = {
    total: reports.length,
    critical: reports.filter((r) => getSeverityType(r.severity_level) === "critical").length,
    moderate: reports.filter((r) => getSeverityType(r.severity_level) === "moderate").length,
    minor: reports.filter((r) => getSeverityType(r.severity_level) === "minor").length,
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <BreadcrumbPath />
          </div>
        </header>

        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Analytics / Community Trends</div>
                <h1 className="text-2xl font-bold">Statistics & Trends</h1>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-card">
                      Last {timePeriod} days
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTimePeriod(1)}>Last 1 day</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod(3)}>Last 3 days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod(7)}>Last 7 days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod(30)}>Last 30 days</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleExport}
                  className="gap-2 bg-[var(--vigil-teal)] text-background hover:bg-[var(--vigil-teal)]/90"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Hazard Frequency Chart */}
            <Card className="mb-6 border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Hazard Frequency Over Time</h2>
              {loading ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">Loading chart...</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.8)" tick={{ fill: "rgba(255, 255, 255, 0.8)" }} />
                      <YAxis stroke="rgba(255, 255, 255, 0.8)" tick={{ fill: "rgba(255, 255, 255, 0.8)" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={chartConfig.dataKey}
                        stroke={chartConfig.color}
                        strokeWidth={2}
                        dot={{ fill: "#ffffff", r: 4 }}
                        activeDot={{ fill: "#ffffff", r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Filter Buttons */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant={activeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter("all")}
                      className={activeFilter === "all" ? "bg-[var(--vigil-teal)] text-background" : ""}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      All hazards
                    </Button>
                    <Button
                      variant={activeFilter === "critical" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter("critical")}
                      className={activeFilter === "critical" ? "bg-[var(--vigil-critical)] text-white" : ""}
                    >
                      Critical
                    </Button>
                    <Button
                      variant={activeFilter === "moderate" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter("moderate")}
                      className={activeFilter === "moderate" ? "bg-[var(--vigil-moderate)] text-background" : ""}
                    >
                      Moderate
                    </Button>
                    <Button
                      variant={activeFilter === "minor" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter("minor")}
                      className={activeFilter === "minor" ? "bg-[var(--vigil-safe)] text-background" : ""}
                    >
                      Minor
                    </Button>
                  </div>
                </>
              )}
            </Card>

            {/* Map Section with Predictions */}
            <Card className="border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Current Predicted Unsafe Areas</h2>
              <div className="h-[500px] w-full overflow-hidden rounded-lg border border-border">
                <MapLayers defaultTileLayer="Default">
                  <MapComponent 
                    center={[18.009025, -76.777948]}
                    zoom={12}
                    maxZoom={18}
                    className="h-full w-full z-0"
                  >
                    <MapTileLayer />
                    <MapTileLayer
                      name="Satellite"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    />
                    
                    {/* Predictive Layer */}
                    <PredictiveLayer predictions={predictions} isVisible={true} />
                    
                    <MapZoomControl />
                    <MapLayersControl />
                  </MapComponent>
                </MapLayers>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <aside className="w-80 border-l border-border bg-card p-6">
            {/* Known Hazardous Locations */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold">Known Hazardous Locations</h2>
              <div className="space-y-3">
                {knownLocations.length > 0 ? (
                  knownLocations.map((location) => (
                    <Card key={location.id} className="border-border bg-background p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              getSeverityType(location.severity_level) === "critical"
                                ? "bg-[var(--vigil-critical)]"
                                : getSeverityType(location.severity_level) === "moderate"
                                  ? "bg-[var(--vigil-moderate)]"
                                  : "bg-[var(--vigil-safe)]"
                            }`}
                          />
                          <h3 className="text-sm font-semibold">{location.location_name}</h3>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            getSeverityType(location.severity_level) === "critical"
                              ? "border-[var(--vigil-critical)] text-[var(--vigil-critical)]"
                              : getSeverityType(location.severity_level) === "moderate"
                                ? "border-[var(--vigil-moderate)] text-[var(--vigil-moderate)]"
                                : "border-[var(--vigil-safe)] text-[var(--vigil-safe)]"
                          }`}
                        >
                          {getSeverityType(location.severity_level).charAt(0).toUpperCase() +
                            getSeverityType(location.severity_level).slice(1)}
                        </Badge>
                      </div>
                      <p className="mb-1 text-xs text-muted-foreground">{location.category}</p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(location.createdAt)}</p>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No locations yet</p>
                )}
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">Quick Filters</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-background p-3">
                  <span className="text-sm">Show only critical</span>
                  <Switch checked={showOnlyCritical} onCheckedChange={setShowOnlyCritical} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background p-3">
                  <span className="text-sm">Hide resolved</span>
                  <Switch checked={hideResolved} onCheckedChange={setHideResolved} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}