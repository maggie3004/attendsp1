import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markAttendanceSchema } from "@/lib/validators";
import { startOfDay, endOfDay } from "date-fns";

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
  const todayDate = startOfDay(today);

  // Check if already marked today
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: todayDate } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Attendance already marked for today" },
      { status: 409 }
    );
  }

  // Determine if late (after 9:30 AM)
  const lateThreshold = new Date(today);
  lateThreshold.setHours(9, 30, 0);
  const isLate = today > lateThreshold;

  const attendance = await prisma.attendance.create({
    data: {
      employeeId,
      siteId: parsed.data.siteId ?? null,
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
