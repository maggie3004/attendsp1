import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createEmployeeSchema } from "@/lib/validators";
import { generateEmployeeCode } from "@/lib/utils";

// GET /api/employees
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? undefined;
  const department = searchParams.get("department") ?? undefined;
  const siteId = searchParams.get("siteId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { employeeCode: { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (department) where.department = { contains: department, mode: "insensitive" };
  if (siteId) {
    where.siteEmployees = { some: { siteId, isActive: true } };
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true, role: true } },
        siteEmployees: {
          where: { isActive: true },
          include: { site: { select: { id: true, name: true, location: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return NextResponse.json({
    data: employees,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    success: true,
  });
}

// POST /api/employees
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, email, password, designation, department, phone, address, siteId, joinDate } =
    parsed.data;
  const profileImage: string | null | undefined = body.profileImage;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const employeeCode = generateEmployeeCode();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "EMPLOYEE",
      image: profileImage || null,
      employee: {
        create: {
          employeeCode,
          designation,
          department,
          phone,
          address,
          faceImage: profileImage || null,
          joinDate: joinDate ? new Date(joinDate) : new Date(),
          ...(siteId && {
            siteEmployees: {
              create: { siteId, isActive: true },
            },
          }),
        },
      },
    },
    include: {
      employee: {
        include: {
          siteEmployees: { include: { site: true } },
        },
      },
    },
  });

  // Create welcome notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Welcome to AttendSP",
      message: `Your account has been created. Employee code: ${employeeCode}`,
      type: "SYSTEM",
    },
  });

  return NextResponse.json({ data: user, success: true }, { status: 201 });
}
