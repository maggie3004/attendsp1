import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Helper: upsert singleton row
async function getSettings() {
  return prisma.systemSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  });
}

// GET /api/settings
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ data: settings, success: true });
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Whitelist allowed fields
  const allowed = [
    "companyName",
    "workStartTime",
    "workEndTime",
    "lateThresholdMins",
    "geofenceEnabled",
    "faceCaptureEnabled",
    "autoMarkAbsent",
    "leaveAlerts",
    "lateAlerts",
  ] as const;

  type SettingsKey = typeof allowed[number];
  const data: Partial<Record<SettingsKey, unknown>> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const settings = await prisma.systemSettings.upsert({
    where: { id: "global" },
    create: { id: "global", ...data },
    update: data,
  });

  return NextResponse.json({ data: settings, success: true });
}
