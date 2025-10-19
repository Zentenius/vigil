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
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Zap, TrendingDown, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface CommunityData {
  safetyScore: number
  status: string
  risk: string
  safeMood: string
  totalReports: number
  verifiedReports: number
  activeAlerts: number
  avgMood: string
}

export default function InsightPage() {
  const [communityData, setCommunityData] = useState<CommunityData>({
    safetyScore: 82,
    status: "Stable",
    risk: "Low Risk",
    safeMood: "Safe",
    totalReports: 1248,
    verifiedReports: 872,
    activeAlerts: 12,
    avgMood: "Calm"
  })

  const [scoreHistory, setScoreHistory] = useState([
    { time: "12h ago", score: 75 },
    { time: "9h ago", score: 78 },
    { time: "6h ago", score: 80 },
    { time: "3h ago", score: 81 },
    { time: "Now", score: 82 }
  ])

  const [incidentTypes] = useState([
    { type: "Fire Hazards", count: 145 },
    { type: "Traffic", count: 234 },
    { type: "Weather", count: 89 },
    { type: "Environmental", count: 156 }
  ])

  const getMoodColor = (mood: string) => {
    switch(mood.toLowerCase()) {
      case "safe":
        return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
      case "calm":
        return "bg-blue-500/20 border-blue-500/50 text-blue-400"
      case "moderate":
        return "bg-amber-500/20 border-amber-500/50 text-amber-400"
      case "alert":
        return "bg-red-500/20 border-red-500/50 text-red-400"
      default:
        return "bg-gray-500/20 border-gray-500/50 text-gray-400"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-emerald-600"
    if (score >= 60) return "from-amber-500 to-amber-600"
    return "from-red-500 to-red-600"
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <BreadcrumbPath />
          </div>
          <Badge className={`${getMoodColor(communityData.safeMood)}`}>
            {communityData.safeMood}
          </Badge>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Community Pulse Header */}
          <Card className="mb-8 border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-teal-950/20 p-8">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  <h1 className="text-2xl font-bold text-white">Community Pulse</h1>
                </div>
                <div className="space-y-2">
                  <h2 className="text-5xl font-bold text-white">Safety Score: {communityData.safetyScore}</h2>
                  <p className="text-sm text-gray-400">Status: {communityData.status} • {communityData.risk}</p>
                </div>
              </div>

              {/* Safety Score Circle */}
              <div className="flex flex-col items-center justify-center">
                <div className={`relative h-48 w-48 rounded-3xl border-4 border-emerald-500 bg-gradient-to-br ${getScoreColor(communityData.safetyScore)} shadow-2xl shadow-emerald-500/20 flex items-center justify-center`}>
                  <div className="text-center">
                    <p className="text-6xl font-bold text-white">{communityData.safetyScore}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="mt-6 flex gap-3">
              <Badge className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30">
                Safe
              </Badge>
              <Badge className="bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30">
                Moderate
              </Badge>
              <Badge className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30">
                Alert
              </Badge>
            </div>
          </Card>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Safety Score Over Time */}
            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-200">Safety score over time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.5)" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Incident Types Last 24h */}
            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-200">Incident types (last 24h)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={incidentTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="type" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.5)" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="mb-8 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-200">Quick Stats</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-900/50 p-4 border border-gray-800">
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-3xl font-bold text-white">{communityData.totalReports.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-gray-900/50 p-4 border border-gray-800">
                <p className="text-sm text-gray-400">Verified</p>
                <p className="text-3xl font-bold text-white">{communityData.verifiedReports.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-gray-900/50 p-4 border border-gray-800">
                <p className="text-sm text-gray-400">Active alerts</p>
                <p className="text-3xl font-bold text-white">{communityData.activeAlerts}</p>
              </div>
              <div className="rounded-lg bg-gray-900/50 p-4 border border-gray-800">
                <p className="text-sm text-gray-400">Avg Mood</p>
                <p className="text-3xl font-bold text-white">{communityData.avgMood}</p>
              </div>
            </div>
          </Card>

          {/* AI Summary */}
          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">AI Summary</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Risk remains low citywide with isolated hotspots downtown. Traffic incidents decreasing, weather-related hazards likely to rise in the evening.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-gray-600">
                Show only critical alerts
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <TrendingDown className="mr-2 h-4 w-4" />
                Refresh Pulse
              </Button>
            </div>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
