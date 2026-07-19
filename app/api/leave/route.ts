import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leaveRequestSchema } from "@/lib/validators";
import { differenceInCalendarDays, parseISO } from "date-fns";

// GET /api/leave
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const employeeId =
    session.user.role === "EMPLOYEE" ? session.user.employeeId : searchParams.get("employeeId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        employee: {
          include: { user: { select: { name: true, image: true } } },
        },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.leave.count({ where }),
  ]);

  return NextResponse.json({
    data: leaves,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    success: true,
  });
}

// POST /api/leave
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = leaveRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
  }

  const { leaveType, startDate, endDate, reason } = parsed.data;

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (end < start) {
    return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
  }

  const totalDays = differenceInCalendarDays(end, start) + 1;

  const leave = await prisma.leave.create({
    data: {
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "PENDING",
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: "New Leave Request",
      message: `A new ${leaveType.toLowerCase()} leave request requires your attention.`,
      type: "LEAVE" as const,
      link: `/admin/leave`,
    })),
  });

  return NextResponse.json({ data: leave, success: true }, { status: 201 });
}
