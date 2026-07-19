import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateAttendanceSchema } from "@/lib/validators";

// GET /api/attendance/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const attendance = await prisma.attendance.findUnique({
    where: { id },
    include: {
      employee: {
        include: { user: { select: { name: true, email: true, image: true } } },
      },
      site: true,
    },
  });

  if (!attendance) {
    return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
  }

  return NextResponse.json({ data: attendance, success: true });
}

// PUT /api/attendance/[id] — Admin update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateAttendanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.checkInTime && { checkInTime: new Date(parsed.data.checkInTime) }),
      ...(parsed.data.checkOutTime && { checkOutTime: new Date(parsed.data.checkOutTime) }),
      notes: parsed.data.notes,
      isManual: true,
    },
  });

  return NextResponse.json({ data: updated, success: true });
}
