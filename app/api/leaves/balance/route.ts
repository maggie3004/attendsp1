import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { differenceInMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId") ?? (session.user.role === "EMPLOYEE" ? session.user.employeeId : null);

  if (!employeeId) {
    return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      leaves: {
        where: { status: "APPROVED" },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Calculate months since join date
  const today = new Date();
  const joinDate = new Date(employee.joinDate);
  // Add 1 to give leaves for the joining month as well.
  const monthsEmployed = Math.max(1, differenceInMonths(today, joinDate) + 1);
  const totalAccrued = monthsEmployed * 2;

  let usedPaid = 0;
  let usedAdvance = 0;

  for (const leave of employee.leaves) {
    if (leave.leaveType === "PAID") usedPaid += leave.totalDays;
    if (leave.leaveType === "ADVANCE") usedAdvance += leave.totalDays;
  }

  const currentBalance = totalAccrued - usedPaid - usedAdvance;

  return NextResponse.json({
    success: true,
    data: {
      totalAccrued,
      usedPaid,
      usedAdvance,
      currentBalance,
      monthsEmployed,
    }
  });
}
