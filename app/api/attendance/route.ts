import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markAttendanceSchema } from "@/lib/validators";
import { startOfDay, endOfDay } from "date-fns";

// Haversine formula to calculate distance in meters between two GPS coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// GET /api/attendance
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? undefined;
  const siteId = searchParams.get("siteId") ?? undefined;
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");

  // Employees can only see their own attendance
  const effectiveEmployeeId =
    session.user.role === "EMPLOYEE" ? session.user.employeeId : employeeId;

  const where: Record<string, unknown> = {};

  if (effectiveEmployeeId) where.employeeId = effectiveEmployeeId;
  if (status) where.status = status;
  if (siteId) where.siteId = siteId;
  if (startDate || endDate) {
    where.date = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }
  if (search) {
    where.employee = {
      user: { name: { contains: search, mode: "insensitive" } },
    };
  }

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: { user: { select: { name: true, image: true } } },
        },
        site: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.attendance.count({ where }),
  ]);

  return NextResponse.json({
    data: attendances,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    success: true,
  });
}

// POST /api/attendance — Mark attendance (Employee)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = markAttendanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
  }

  const today = new Date();
  
  // Convert current time to Asia/Kolkata
  const istDateStr = new Intl.DateTimeFormat("en-CA", { 
    timeZone: "Asia/Kolkata", 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit" 
  }).format(today);
  const todayDate = new Date(`${istDateStr}T00:00:00.000Z`);

  // Load system settings (singleton)
  const sysSettings = await prisma.systemSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  });

  // Calculate late in IST using minutes
  const options = { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit', hour12: false } as const;
  const [currentHour, currentMin] = new Intl.DateTimeFormat('en-US', options).format(today).split(':').map(Number);
  const currentTotalMins = currentHour * 60 + currentMin;

  const [startHour, startMin] = sysSettings.workStartTime.split(":").map(Number);
  const thresholdTotalMins = startHour * 60 + startMin + sysSettings.lateThresholdMins;
  
  const isLate = currentTotalMins > thresholdTotalMins;

  // Look up employee's active site if not provided
  let siteId = parsed.data.siteId;
  if (!siteId) {
    const employeeWithSite = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { siteEmployees: { where: { isActive: true } } },
    });
    siteId = employeeWithSite?.siteEmployees[0]?.siteId;
  }

  // GPS Validation — only enforce if geofence is enabled in settings
  if (sysSettings.geofenceEnabled) {
    if (!siteId) {
      return NextResponse.json({ error: "No site assigned. Please contact your admin." }, { status: 400 });
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Assigned site not found." }, { status: 404 });
    }

    if (site.latitude && site.longitude) {
      if (!parsed.data.checkInLat || !parsed.data.checkInLng) {
        return NextResponse.json({ error: "GPS location is required to mark attendance." }, { status: 400 });
      }

      const distance = getDistance(
        parsed.data.checkInLat,
        parsed.data.checkInLng,
        site.latitude,
        site.longitude
      );

      if (distance > site.radius) {
        return NextResponse.json(
          { error: `Too far away. You are ${Math.round(distance)}m from the site, but must be within ${site.radius}m.` },
          { status: 403 }
        );
      }
    }
  }

  // Check if already marked today
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: todayDate } },
  });

  if (existing) {
    if (existing.checkOutTime) {
      return NextResponse.json(
        { error: "Attendance already completely marked for today (Checked In & Checked Out)" },
        { status: 409 }
      );
    }
    
    // Perform check-out
    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime: today,
        checkOutImage: parsed.data.checkInImage ?? null,
        checkOutLat: parsed.data.checkInLat ?? null,
        checkOutLng: parsed.data.checkInLng ?? null,
      },
      include: { site: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ data: updated, success: true }, { status: 200 });
  }

  const attendance = await prisma.attendance.create({
    data: {
      employeeId,
      siteId: siteId ?? null,
      date: todayDate,
      checkInTime: today,
      checkInImage: parsed.data.checkInImage ?? null,
      checkInLat: parsed.data.checkInLat ?? null,
      checkInLng: parsed.data.checkInLng ?? null,
      status: isLate ? "LATE" : "PRESENT",
      notes: parsed.data.notes ?? null,
    },
    include: {
      site: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: attendance, success: true }, { status: 201 });
}
