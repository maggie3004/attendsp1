import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

// GET /api/dashboard/stats
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());

  const [
    totalEmployees,
    presentToday,
    lateToday,
    activeSites,
    pendingLeaves,
    onLeaveToday,
    recentAttendances,
    recentLeaves,
    recentNotifications,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.attendance.count({
      where: { date: today, status: "PRESENT" },
    }),
    prisma.attendance.count({
      where: { date: today, status: "LATE" },
    }),
    prisma.site.count({ where: { status: "ACTIVE" } }),
    prisma.leave.count({ where: { status: "PENDING" } }),
    prisma.leave.count({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    prisma.attendance.findMany({
      where: { date: today },
      include: {
        employee: { include: { user: { select: { name: true, image: true } } } },
        site: { select: { name: true } },
      },
      orderBy: { checkInTime: "desc" },
      take: 8,
    }),
    prisma.leave.findMany({
      where: { status: "PENDING" },
      include: {
        employee: { include: { user: { select: { name: true, image: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalActive = totalEmployees;
  const markedToday = presentToday + lateToday + onLeaveToday;
  const absentToday = Math.max(0, totalActive - markedToday);

  return NextResponse.json({
    data: {
      totalEmployees: totalActive,
      presentToday,
      absentToday,
      lateToday,
      onLeaveToday,
      activeSites,
      pendingLeaveRequests: pendingLeaves,
      recentAttendances,
      recentLeaves,
      recentNotifications,
    },
    success: true,
  });
}
