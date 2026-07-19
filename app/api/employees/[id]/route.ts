import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { updateEmployeeSchema } from "@/lib/validators";

// GET /api/employees/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, role: true } },
      siteEmployees: {
        include: { site: true },
        orderBy: { assignedAt: "desc" },
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 30,
        include: { site: { select: { id: true, name: true } } },
      },
      leaves: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { approvedBy: { select: { name: true } } },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json({ data: employee, success: true });
}

// PUT /api/employees/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, email, designation, department, phone, address, status } = parsed.data;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Update user and employee in a transaction
  const updated = await prisma.$transaction([
    prisma.user.update({
      where: { id: employee.userId },
      data: { name, email },
    }),
    prisma.employee.update({
      where: { id },
      data: { designation, department, phone, address, ...(status && { status }) },
    }),
  ]);

  return NextResponse.json({ data: updated, success: true });
}

// DELETE /api/employees/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Cascade deletes via User (Prisma schema handles it)
  await prisma.user.delete({ where: { id: employee.userId } });

  return NextResponse.json({ success: true, message: "Employee deleted" });
}
