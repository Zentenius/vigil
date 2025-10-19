"use client"

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

interface DatabaseReport {
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

interface ReportsTableProps {
  reports?: DatabaseReport[]
  loading?: boolean
}

export function ReportsTable({ reports = [], loading = false }: ReportsTableProps) {
  const router = useRouter()

  // Helper function to convert severity level to badge text
  const getSeverityLabel = (severity: number): string => {
    if (severity >= 4) return 'Critical'
    if (severity >= 2) return 'Moderate'
    return 'Safe'
  }

  // Helper function to get time ago
  const getTimeAgo = (date: string): string => {
    const now = new Date()
    const reportDate = new Date(date)
    const diffMs = now.getTime() - reportDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Loading reports...
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No reports found
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-border">
            <th className="w-24 px-4 py-4 text-left text-sm font-medium text-muted-foreground">Sev.</th>
            <th className="w-20 px-4 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">Description</th>
            <th className="w-24 px-4 py-4 text-left text-sm font-medium text-muted-foreground">Location</th>
            <th className="w-20 px-4 py-4 text-left text-sm font-medium text-muted-foreground">Time</th>
            <th className="w-32 px-4 py-4 text-left text-sm font-medium text-muted-foreground">Reporter</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const initials = report.user?.name
              ? report.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
              : 'U'
            
            return (
              <tr
                key={report.id}
                onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                className="border-b border-border transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <td className="w-20 px-4 py-4">
                  <Badge
                    className={
                      getSeverityLabel(report.severity_level) === "Critical"
                        ? "bg-[var(--vigil-critical)] text-white hover:bg-[var(--vigil-critical)]"
                        : getSeverityLabel(report.severity_level) === "Moderate"
                          ? "bg-[var(--vigil-moderate)] text-background hover:bg-[var(--vigil-moderate)]"
                          : "bg-[var(--vigil-safe)] text-background hover:bg-[var(--vigil-safe)]"
                    }
                  >
                    {getSeverityLabel(report.severity_level).substring(0, 3)}
                  </Badge>
                </td>
                <td className="w-20 overflow-hidden truncate px-4 py-4 text-sm font-medium capitalize">{report.category}</td>
                <td className="overflow-hidden truncate px-4 py-4 text-sm text-muted-foreground">{report.description}</td>
                <td className="w-32 overflow-hidden truncate px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{report.location_name || `${report.latitude.toFixed(2)}, ${report.longitude.toFixed(2)}`}</span>
                  </div>
                </td>
                <td className="w-20 px-4 py-4 text-sm text-muted-foreground">{getTimeAgo(report.createdAt)}</td>
                <td className="w-32 overflow-hidden px-4 py-4">
                  <div className="flex items-center gap-2 truncate">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{report.user?.name || 'Anonymous'}</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
