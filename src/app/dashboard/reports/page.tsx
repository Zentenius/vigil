"use client"
import { AppSidebar } from "~/components/app-sidebar"
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
import { BreadcrumbPath } from "~/components/breadcrumb-path"
import { Badge } from "~/components/ui/badge"   
import { useState, useEffect } from "react"
import { QuickStats } from "~/components/quick-stats"
import { Button } from "~/components/ui/button"
import { AlertTriangle, ChevronDown, Filter, Plus, Search, Shield } from "lucide-react"
import { ReportsTable } from "~/components/reports-table"
import { Input } from "~/components/ui/input"
import { ReportHazardForm } from "~/components/report-hazard-form"
import { useAbly } from "~/components/AblyProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"

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

export default function Page() {
  const ably = useAbly()
  const [isNewReportOpen, setIsNewReportOpen] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'moderate' | 'safe'>('all')
  const [realtimeMessages, setRealtimeMessages] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | '30days' | '24hours'>('all')
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)

  // Fetch reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/report')
        if (response.ok) {
          const data = await response.json()
          setReports(data)
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

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

  // Get severity type from severity level
  const getSeverityType = (severity: number): 'critical' | 'moderate' | 'safe' => {
    if (severity >= 4) return 'critical'
    if (severity >= 2) return 'moderate'
    return 'safe'
  }

  // Calculate stats from reports
  const stats = {
    totalReports: reports.length,
    criticalReports: reports.filter(r => getSeverityType(r.severity_level) === 'critical').length,
    moderateReports: reports.filter(r => getSeverityType(r.severity_level) === 'moderate').length,
    safeReports: reports.filter(r => getSeverityType(r.severity_level) === 'safe').length,
  }

  // Filter and search reports
  useEffect(() => {
    let filtered = reports

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date()
      let cutoffDate = new Date()

      if (timeFilter === '24hours') {
        cutoffDate.setHours(now.getHours() - 24)
      } else if (timeFilter === '7days') {
        cutoffDate.setDate(now.getDate() - 7)
      } else if (timeFilter === '30days') {
        cutoffDate.setDate(now.getDate() - 30)
      }

      filtered = filtered.filter((report) => {
        const reportDate = new Date(report.createdAt)
        return reportDate >= cutoffDate
      })
    }

    // Apply severity filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((report) => {
        const type = getSeverityType(report.severity_level)
        return type === selectedFilter
      })
    }

    // Apply search filter
    if (searchText.trim()) {
      const query = searchText.toLowerCase()
      filtered = filtered.filter((report) =>
        report.id.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.location_name?.toLowerCase().includes(query) ||
        report.category.toLowerCase().includes(query)
      )
    }

    setFilteredReports(filtered)
  }, [reports, selectedFilter, searchText, timeFilter])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <BreadcrumbPath/>
            </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="shrink-0 border-b border-border bg-background px-8 py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search reports by ID, title or location" 
                className="pl-10 bg-card border-border"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {/* Header with Filters */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Reports History</h1>
              </div>
              <Button
                onClick={() => setIsNewReportOpen(true)}
                className="bg-[var(--vigil-teal)] text-background hover:bg-[var(--vigil-teal)]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge 
                className={`cursor-pointer ${selectedFilter === 'critical' ? 'bg-[var(--vigil-critical)] text-white' : 'bg-[var(--vigil-critical)]/20 text-[var(--vigil-critical)]'} hover:bg-[var(--vigil-critical)]/90`}
                onClick={() => setSelectedFilter(selectedFilter === 'critical' ? 'all' : 'critical')}
              >
                Critical
              </Badge>
              <Badge 
                className={`cursor-pointer ${selectedFilter === 'moderate' ? 'bg-[var(--vigil-moderate)] text-background' : 'bg-[var(--vigil-moderate)]/20 text-[var(--vigil-moderate)]'} hover:bg-[var(--vigil-moderate)]/90`}
                onClick={() => setSelectedFilter(selectedFilter === 'moderate' ? 'all' : 'moderate')}
              >
                Moderate
              </Badge>
              <Badge 
                className={`cursor-pointer ${selectedFilter === 'safe' ? 'bg-[var(--vigil-safe)] text-background' : 'bg-[var(--vigil-safe)]/20 text-[var(--vigil-safe)]'} hover:bg-[var(--vigil-safe)]/90`}
                onClick={() => setSelectedFilter(selectedFilter === 'safe' ? 'all' : 'safe')}
              >
                Safe
              </Badge>
              {/* Time Filter Dropdown */}
              <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'all' | '7days' | '30days' | '24hours')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="24hours">Last 24 hours</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              {/* More Filters Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-transparent"
                onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
              >
                <Filter className="h-4 w-4" />
                More filters
              </Button>
            </div>
          </div>

          {/* Content Container */}
          <div className="flex flex-1 overflow-hidden">
            {/* Main Content - Reports Table */}
            <div className="flex-1 overflow-auto">
              <div className="p-8">
                <ReportsTable reports={filteredReports} loading={loading} />
              </div>
            </div>

            {/* Right Sidebar */}
            <aside className="w-80 shrink-0 h-fit border-l border-border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">Quick Stats</h2>
              </div>

              <QuickStats 
                totalReports={stats.totalReports}
                criticalReports={stats.criticalReports}
                moderateReports={stats.moderateReports}
                safeReports={stats.safeReports}
              />
            </aside>
          </div>
        </div>
        
        {/* More Filters Modal */}
        <Dialog open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Additional Filters</DialogTitle>
              <DialogDescription>
                Refine your report search with additional criteria
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="hazard">Hazard</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Reporter</label>
                <Input 
                  placeholder="Search by reporter name..."
                  className="w-full"
                />
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input 
                  placeholder="Search by location..."
                  className="w-full"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline"
                onClick={() => setIsMoreFiltersOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setIsMoreFiltersOpen(false)}
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <ReportHazardForm 
          open={isNewReportOpen}
          onOpenChange={setIsNewReportOpen}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
