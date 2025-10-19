
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { Realtime } from "ably";
import { ReportCategory, ReportStatus, VerificationStatus } from "@prisma/client";

export async function GET() {
  try {
    const reports = await db.report.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const {
      userId,
      latitude,
      longitude,
      location_name,
      category,
      tags,
      severity_level,
      description,
      media,
    } = await req.json();

    // Validate required fields
    if (!userId || !latitude || !longitude || !category || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate category enum
    if (!Object.values(ReportCategory).includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Create the report
    const report = await db.report.create({
      data: {
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_name,
        category: category as ReportCategory,
        tags: tags || [],
        severity_level: parseInt(severity_level) || 1,
        description,
        media: media || [],
        status: ReportStatus.ACTIVE,
        verification_status: VerificationStatus.UNVERIFIED,
        credibility_score: 50,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    // Publish to Ably for real-time updates (do not block the HTTP response)
    if (process.env.ABLY_SERVER_KEY) {
      try {
        const ably = new Realtime({ key: process.env.ABLY_SERVER_KEY });
        const channel = ably.channels.get('reports');
        // fire-and-forget: don't await so slow/misconfigured Ably won't hang the request
        channel.publish('report-created', report).catch((err: any) => console.error('Ably publish failed', err));
      } catch (err) {
        console.error('Ably init/publish error', err);
      }
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}


