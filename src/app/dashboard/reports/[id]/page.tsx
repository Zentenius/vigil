"use client"

import { AppSidebar } from "~/components/app-sidebar"
import { BreadcrumbPath } from "~/components/breadcrumb-path"
import { Separator } from "~/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { MapPin, Clock, AlertCircle, Navigation, List, CheckCircle, AlertTriangle, ChevronLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { GreenMapMarkerIcon } from "~/components/ui/green-map-marker-icon"

// Dynamically import map components to avoid SSR issues
const Map = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.Map })), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>
})
const MapTileLayer = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapTileLayer })), { ssr: false })
const MapMarker = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapMarker })), { ssr: false })
const MapPopup = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapPopup })), { ssr: false })
const MapZoomControl = dynamic(() => import("~/components/ui/map").then(mod => ({ default: mod.MapZoomControl })), { ssr: false })

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
    image: string | null
  }
}

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapKey, setMapKey] = useState<string>(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  const reportId = params.id as string

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/report/${reportId}`)
        if (!response.ok) {
          throw new Error('Report not found')
        }
        const data = await response.json()
        setReport(data)
        // Regenerate map key when report loads to ensure fresh map container
        setMapKey(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch report')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId])

  const getSeverityLabel = (severity: number): string => {
    if (severity >= 4) return "Critical"
    if (severity >= 2) return "Moderate"
    return "Safe"
  }

  const getSeverityType = (severity: number): "critical" | "moderate" | "safe" => {
    if (severity >= 4) return "critical"
    if (severity >= 2) return "moderate"
    return "safe"
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

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  if (loading) {
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
          <div className="flex items-center justify-center flex-1">
            <div className="text-muted-foreground">Loading report...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !report) {
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
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Report Not Found</h1>
              <p className="text-muted-foreground mt-2">{error || "This report could not be found."}</p>
            </div>
            <Button onClick={() => router.push("/dashboard/reports")} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Reports
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const severityType = getSeverityType(report.severity_level)
  const severityLabel = getSeverityLabel(report.severity_level)
  const timeAgo = getTimeAgo(report.createdAt)

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

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-8">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              className="mb-6 gap-2"
              onClick={() => router.push("/dashboard/reports")}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Reports
            </Button>

            {/* Overview Section */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-muted-foreground">Overview</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className={
                    severityType === "critical"
                      ? "bg-[var(--vigil-critical)] text-white hover:bg-[var(--vigil-critical)]"
                      : severityType === "moderate"
                        ? "bg-[var(--vigil-moderate)] text-background hover:bg-[var(--vigil-moderate)]"
                        : "bg-[var(--vigil-safe)] text-background hover:bg-[var(--vigil-safe)]"
                  }
                >
                  {severityLabel}
                </Badge>
                <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{report.location_name || "Unknown location"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-muted-foreground">Details</h2>

              {/* Description */}
              <div className="mb-4 rounded-lg border border-border bg-card p-4">
                <div className="mb-1 text-sm text-muted-foreground">Description</div>
                <div className="leading-relaxed">{report.description}</div>
              </div>

              {/* Category */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-1 text-sm text-muted-foreground">Category</div>
                <div className="font-medium">{report.category}</div>
              </div>
            </div>

            {/* Location Section */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-muted-foreground">Location</h2>
              <div className="overflow-hidden rounded-lg border border-border h-[500px]">
                <Map
                  key={mapKey}
                  center={[report.latitude, report.longitude]}
                  zoom={16}
                  maxZoom={18}
                  className="h-full w-full"
                >
                  <MapTileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapMarker position={[report.latitude, report.longitude]} icon={<GreenMapMarkerIcon />}
                                  iconAnchor={[16, 32]}>
                    <MapPopup>
                      <div className="text-sm">
                        <p className="font-semibold">{report.location_name || "Report Location"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                        </p>
                      </div>
                      
                    </MapPopup>
                  </MapMarker>
                  <MapZoomControl />
                </Map>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-96 shrink-0 border-l border-border bg-card p-6 overflow-auto">
            {/* Reporter */}
            {report.user && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Reporter</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={report.user.image || ""} />
                    <AvatarFallback className="bg-[var(--vigil-primary)]/10 text-[var(--vigil-primary)]">
                      {getInitials(report.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{report.user.name || "Anonymous"}</div>
                    <div className="text-sm text-muted-foreground">{report.user.email || "No email"}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start gap-2 bg-[var(--vigil-teal)] text-background hover:bg-[var(--vigil-teal)]/90">
                  <CheckCircle className="h-4 w-4" />
                  Confirm
                </Button>
                <Button variant="destructive" className="w-full justify-start gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Dispute
                </Button>
              </div>
            </div>

            {/* Tags */}
            {report.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={
                        tag === "safe"
                          ? "bg-[var(--vigil-safe)] text-background hover:bg-[var(--vigil-safe)]"
                          : tag === "critical"
                            ? "bg-[var(--vigil-critical)] text-white hover:bg-[var(--vigil-critical)]"
                            : tag === "moderate"
                              ? "bg-[var(--vigil-moderate)] text-background hover:bg-[var(--vigil-moderate)]"
                              : "bg-muted text-foreground hover:bg-muted"
                      }
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Related */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Related</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <List className="h-4 w-4" />
                  View all {report.location_name} reports
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}