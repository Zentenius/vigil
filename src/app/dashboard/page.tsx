"use client"

import { AppSidebar } from "~/components/app-sidebar"
import { BreadcrumbPath } from "~/components/breadcrumb-path"
import { useState, useEffect } from "react"
import { useAbly } from "~/components/AblyProvider"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Plus, Activity, CheckCircle, Users, TrendingUp, Circle } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { Separator } from "~/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { InteractiveMap } from "~/components/ui/interactive-map"
import type { PredictionResult } from "~/lib/enhancedPredictiveEngine"
import { ReportHazardForm } from "~/components/report-hazard-form"
import { LeafletFix } from "~/components/ui/leaflet-fix"
import { RiskAdvisorChat } from "~/components/risk-advisor-chat"

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

interface LiveFeedItem {
  id: string
  type: 'critical' | 'moderate' | 'safe'
  title: string
  location: string
  timeAgo: string
  user: string
  avatar?: string
  isRealtime?: boolean
}

export default function Dashboard() {
  const ably = useAbly()
  const [reports, setReports] = useState<Report[]>([])
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [realtimeMessages, setRealtimeMessages] = useState<string[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'moderate' | 'safe'>('all')
  const [isReportFormOpen, setIsReportFormOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.009025, -76.777948])

  // EMERGENCY FIX: Clean up any existing Leaflet containers
  useEffect(() => {
    const cleanupLeafletContainers = () => {
      try {
        // Clear all existing leaflet containers
        const containers = document.querySelectorAll('.leaflet-container')
        containers.forEach(container => {
          if ((container as any)._leaflet_id) {
            (container as any)._leaflet_id = null
          }
        })
        
        // Clear any map divs that might have leaflet state
        const mapDivs = document.querySelectorAll('div[id*="map"]')
        mapDivs.forEach(div => {
          if ((div as any)._leaflet_id) {
            (div as any)._leaflet_id = null
          }
        })
        
        console.log('🗺️ Leaflet containers cleaned up successfully')
      } catch (error) {
        console.warn('Leaflet cleanup warning (safe to ignore):', error)
      }
    }

    // Run cleanup immediately
    cleanupLeafletContainers()
    
    // Run cleanup on unmount
    return cleanupLeafletContainers
  }, [])

  // Function to convert timestamp to relative time
  const getTimeAgo = (dateString: string): string => {
    const now = new Date()
    const reportDate = new Date(dateString)
    const diffMs = now.getTime() - reportDate.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    if (diffMonths < 12) return `${diffMonths}mo ago`
    return `${diffYears}y ago`
  }
  
  
    // Set up real-time subscriptions and fetch initial reports
    useEffect(() => {
      // Create a channel for reports
      const channel = ably.channels.get('reports');
  
      // Subscribe to new report events
      const onNewReport = (message: any) => {
        const newReport = message.data as Report;
        setReports(prev => [newReport, ...prev]);
        setRealtimeMessages(prev => [...prev, `New report created: ${newReport.location_name || 'Unknown location'} by ${newReport.user?.name || newReport.user?.email || 'Unknown User'}`]);
      };
  
      // Subscribe to report updates
      const onReportUpdate = (message: any) => {
        const updatedReport = message.data as Report;
        setReports(prev => 
          prev.map(report => 
            report.id === updatedReport.id ? updatedReport : report
          )
        );
        setRealtimeMessages(prev => [...prev, `Report updated: ${updatedReport.location_name || 'Unknown location'}`]);
      };
  
      // Subscribe to events
      channel.subscribe('report-created', onNewReport);
      channel.subscribe('report-updated', onReportUpdate);
  
      // Fetch initial reports
      fetchReports();
  
      // Cleanup subscriptions
      return () => {
        channel.unsubscribe('report-created', onNewReport);
        channel.unsubscribe('report-updated', onReportUpdate);
      };
    }, [ably]);
  
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/report');
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

  // Filter reports based on severity
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredReports(reports)
    } else {
      const filtered = reports.filter(report => {
        const type = getSeverityType(report.severity_level)
        return type === selectedFilter
      })
      setFilteredReports(filtered)
    }
  }, [reports, selectedFilter])

  const getSeverityType = (severity: number): 'critical' | 'moderate' | 'safe' => {
    if (severity >= 4) return 'critical'
    if (severity >= 2) return 'moderate'
    return 'safe'
  }

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500 text-white'
      case 'moderate': return 'bg-orange-500 text-white'
      case 'safe': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  // Calculate stats
  const totalReports = reports.length
  const verifiedReports = Math.floor(totalReports * 0.7) // 70% verified (dummy)
  const activeAlerts = reports.filter(r => getSeverityType(r.severity_level) === 'critical').length
  const communityMood = activeAlerts > 5 ? 'Vigilant' : activeAlerts > 2 ? 'Concerned' : 'Calm'

  const handleRealtimeMessage = (message: string) => {
    setRealtimeMessages(prev => [...prev, message])
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
        
        <div className="flex-1 space-y-4 p-4 pt-0">
          {/* Top Section with Map and Stats */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 min-h-[60vh]">
            {/* Map Section - Takes 2 columns on md+ */}
            <div className="md:col-span-2">
              {/* <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Community Watch Map</CardTitle>
                      <CardDescription>Real-time incident tracking</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={selectedFilter === 'critical' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('critical')}
                      >
                        Critical
                      </Button>
                      <Button
                        variant={selectedFilter === 'moderate' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('moderate')}
                        className={selectedFilter === 'moderate' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                      >
                        Moderate
                      </Button>
                      <Button
                        variant={selectedFilter === 'safe' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('safe')}
                        className={selectedFilter === 'safe' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        Safe
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[420px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">Loading map...</div>
                    </div>
                  ) : (
                    <InteractiveMap 
                      reports={filteredReports} 
                      className="h-full"
                    />
                  )}
                </CardContent>
              </Card> */}
              {loading ? (
                <div className="flex items-center justify-center h-[50vh] md:h-full">
                  <div className="text-center">Loading map...</div>
                </div>
              ) : (
                <LeafletFix className="relative h-[50vh] md:h-[72vh] lg:h-[72vh]">
                  <InteractiveMap 
                    reports={reports} 
                    predictions={predictions}
                    className="h-full" 
                  />
                </LeafletFix>
              )}
            </div>

            {/* Quick Stats - Takes 1 column */}
            <div className="flex flex-col space-y-4">
              <Card className="shrink-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{totalReports.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Total Reports</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{verifiedReports}</div>
                      <p className="text-xs text-muted-foreground">Verified</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{activeAlerts}</div>
                      <p className="text-xs text-muted-foreground">Active Alerts</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{communityMood}</div>
                      <p className="text-xs text-muted-foreground">Community Mood</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Feed */}
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3 shrink-0 flex items-center flex-row justify-between">
                  <CardTitle className="text-sm font-medium">Live Feed</CardTitle>
                    <div className="w-44">
                      <Select value={selectedFilter} onValueChange={(val) => setSelectedFilter(val as any)}>
                        <SelectTrigger className="w-full rounded-full px-2 py-1">
                          <div className={`flex items-center gap-2 justify-center px-2 py-1 rounded-full ${selectedFilter === 'critical' ? 'bg-red-500/20 text-red-700' : selectedFilter === 'moderate' ? 'bg-orange-400/20 text-orange-700' : selectedFilter === 'safe' ? 'bg-green-500/20 text-green-700' : 'bg-white/5 text-muted-foreground'}`}>
                            <span className={`inline-block rounded-full w-3 h-3 ${selectedFilter === 'critical' ? 'bg-red-500' : selectedFilter === 'moderate' ? 'bg-orange-400' : selectedFilter === 'safe' ? 'bg-green-500' : 'bg-gray-400/50'}`}></span>
                            <SelectValue placeholder="Filter" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="safe">Safe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </CardHeader>
                <CardContent className="h-[300px] md:h-[400px] space-y-3 overflow-y-auto">
                  {(filteredReports.length ? filteredReports : reports).map((item) => {
                    const displayName = item.user?.name || item.user?.email || 'Anonymous'
                    const initials = item.user?.name
                      ? (item.user.name || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                      : ((item.user?.email ?? '')[0] ?? 'A').toUpperCase()

                    return (
                      <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/50">
                        <Badge className={`${getSeverityColor(getSeverityType(item.severity_level))} text-xs rounded-full w-5 h-5`}>
                        </Badge>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{item.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{getTimeAgo(item.createdAt)}</span>
                            <span>•</span>
                            <span>{item.location_name}</span>
                            <span>•</span>
                            <span>by {displayName}</span>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <Avatar>
                            {/* If a user image field exists on the user object (future), use it; otherwise fall back to initials */}
                            {((item.user as any)?.image) ? (
                              <AvatarImage src={(item.user as any).image} alt={displayName} />
                            ) : (
                              <AvatarFallback>{initials}</AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
                        {/* New Report Button */}
          <div className="">
            <Button 
              size="lg" 
              className="bg-green-500 hover:bg-green-600 w-full text-white shadow-lg"
              onClick={() => setIsReportFormOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Report
            </Button>
          </div>
            </div>
          </div>


        </div>
      </SidebarInset>

      {/* Report Hazard Form Dialog */}
      <ReportHazardForm 
        open={isReportFormOpen}
        onOpenChange={setIsReportFormOpen}
      />

      {/* Risk Advisor Chat */}
      <RiskAdvisorChat />
    </SidebarProvider>
  )
}