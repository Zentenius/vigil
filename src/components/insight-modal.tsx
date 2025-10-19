"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "~/components/ui/drawer"
import { useIsMobile } from "~/hooks/use-mobile"
import { Card } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Zap, TrendingDown, AlertCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface InsightModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InsightModal({ open, onOpenChange }: InsightModalProps) {
  const isMobile = useIsMobile()
  
  const [communityData] = useState({
    safetyScore: 82,
    status: "Stable",
    risk: "Low Risk",
    safeMood: "Safe",
    totalReports: 1248,
    verifiedReports: 872,
    activeAlerts: 12,
    avgMood: "Calm"
  })

  const [scoreHistory] = useState([
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-emerald-600"
    if (score >= 60) return "from-amber-500 to-amber-600"
    return "from-red-500 to-red-600"
  }

  const content = (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Community Pulse Header */}
      <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-teal-950/20 p-6">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Community Pulse</h2>
            </div>
            <h3 className="text-3xl font-bold text-white">Safety Score: {communityData.safetyScore}</h3>
            <p className="text-xs text-gray-400 mt-1">Status: {communityData.status} • {communityData.risk}</p>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            <Badge className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
              Safe
            </Badge>
            <Badge className="bg-amber-500/20 border border-amber-500/50 text-amber-400">
              Moderate
            </Badge>
            <Badge className="bg-red-500/20 border border-red-500/50 text-red-400">
              Alert
            </Badge>
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="space-y-4">
        {/* Safety Score Over Time */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-200">Safety score over time</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.5)" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Types Last 24h */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-200">Incident types (last 24h)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={incidentTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="type" stroke="rgba(255,255,255,0.5)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.5)" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-200">Quick Stats</h4>
        <div className="grid gap-2 grid-cols-4">
          <div className="rounded bg-gray-800 p-3 text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-bold text-white">{(communityData.totalReports / 100).toFixed(0)}K</p>
          </div>
          <div className="rounded bg-gray-800 p-3 text-center">
            <p className="text-xs text-gray-400">Verified</p>
            <p className="text-lg font-bold text-white">{(communityData.verifiedReports / 100).toFixed(0)}K</p>
          </div>
          <div className="rounded bg-gray-800 p-3 text-center">
            <p className="text-xs text-gray-400">Active</p>
            <p className="text-lg font-bold text-white">{communityData.activeAlerts}</p>
          </div>
          <div className="rounded bg-gray-800 p-3 text-center">
            <p className="text-xs text-gray-400">Mood</p>
            <p className="text-sm font-bold text-emerald-400">{communityData.avgMood}</p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-white">AI Summary</h4>
        </div>
        <p className="mb-4 text-xs text-gray-300">
          Risk remains low citywide with isolated hotspots downtown. Traffic incidents decreasing, weather-related hazards likely to rise in the evening.
        </p>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="border-gray-600 text-xs h-8">
            Show only critical alerts
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8">
            <TrendingDown className="mr-1 h-3 w-3" />
            Refresh Pulse
          </Button>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-gray-950 border-gray-800">
          <DrawerHeader>
            <DrawerTitle className="text-white">Community Insight</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-white">Community Insight</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
