import { NextResponse } from "next/server"
import { db } from "~/server/db"

export async function GET(req: Request, { params }: any) {
  try {
    const reportId = params.id

    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error fetching report:", error)
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: any) {
  try {
    const reportId = params.id
    const body = await req.json()
    const action = body?.action

    if (!action || (action !== 'confirm' && action !== 'dispute')) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const report = await db.report.findUnique({ where: { id: reportId } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Simple adjustment values; these match the optimistic UI deltas used elsewhere
    const delta = action === 'confirm' ? 5 : -10

    // Clamp between 0 and 100
    const newScore = Math.max(0, Math.min(100, report.credibility_score + delta))

    const updated = await db.report.update({
      where: { id: reportId },
      data: { credibility_score: newScore },
    })

    return NextResponse.json({ credibility_score: updated.credibility_score })
  } catch (error) {
    console.error('Error updating report credibility:', error)
    return NextResponse.json({ error: 'Failed to update credibility' }, { status: 500 })
  }
}
