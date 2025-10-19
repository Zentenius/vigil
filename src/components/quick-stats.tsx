import { Card } from "~/components/ui/card"

interface QuickStatsProps {
  totalReports?: number
  criticalReports?: number
  moderateReports?: number
  safeReports?: number
}

export function QuickStats({ 
  totalReports = 0, 
  criticalReports = 0, 
  moderateReports = 0,
  safeReports = 0 
}: QuickStatsProps) {
  const criticalPercentage = totalReports > 0 ? (criticalReports / totalReports) * 100 : 0
  const circumference = 2 * Math.PI * 56

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Reports</div>
          <div className="mt-1 text-2xl font-bold">{totalReports}</div>
        </Card>
        <Card className="border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Critical</div>
          <div className="mt-1 text-2xl font-bold">{criticalReports}</div>
        </Card>
        <Card className="border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Moderate</div>
          <div className="mt-1 text-2xl font-bold">{moderateReports}</div>
        </Card>
        <Card className="border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Safe</div>
          <div className="mt-1 text-2xl font-bold">{safeReports}</div>
        </Card>
      </div>

      {/* Pulse Meter */}
      <Card className="border-border bg-card p-6">
        <div className="mb-4 text-sm text-muted-foreground">Critical %</div>
        <div className="flex items-center justify-center">
          <div className="relative h-32 w-32">
            <svg className="h-32 w-32 -rotate-90 transform">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="var(--vigil-critical)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(criticalPercentage / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(criticalPercentage)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-lg font-semibold">{criticalReports} Critical</div>
          <div className="text-sm text-muted-foreground">of {totalReports} total</div>
        </div>
      </Card>
    </div>
  )
}
