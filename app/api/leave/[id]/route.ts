import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leaveActionSchema } from "@/lib/validators";

// GET /api/leave/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const leave = await prisma.leave.findUnique({
    where: { id },
    include: {
      employee: {
        include: { user: { select: { name: true, email: true, image: true } } },
      },
      approvedBy: { select: { name: true, email: true } },
    },
  });

  if (!leave) {
    return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
  }

  return NextResponse.json({ data: leave, success: true });
}

// PUT /api/leave/[id] — Approve / Reject
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = leaveActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const leave = await prisma.leave.findUnique({
    where: { id },
    include: { employee: { include: { user: true } } },
  });

  if (!leave) {
    return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
  }

  if (leave.status !== "PENDING") {
    return NextResponse.json({ error: "Leave request already processed" }, { status: 400 });
  }

  const updated = await prisma.leave.update({
    where: { id },
    data: {
      status: parsed.data.status,
      approvedById: session.user.id,
      approvedAt: new Date(),
      ...(parsed.data.rejectionNote && { rejectionNote: parsed.data.rejectionNote }),
    },
  });

  // Notify the employee
  await prisma.notification.create({
    data: {
      userId: leave.employee.userId,
      title: `Leave Request ${parsed.data.status === "APPROVED" ? "Approved" : "Rejected"}`,
      message:
        parsed.data.status === "APPROVED"
          ? `Your leave request from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been approved.`
          : `Your leave request has been rejected. ${parsed.data.rejectionNote ?? ""}`,
      type: "LEAVE",
    },
  });

  return NextResponse.json({ data: updated, success: true });
}
