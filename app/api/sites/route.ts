import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSiteSchema } from "@/lib/validators";

// GET /api/sites
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [sites, total] = await Promise.all([
    prisma.site.findMany({
      where,
      include: {
        siteEmployees: {
          where: { isActive: true },
          include: {
            employee: {
              include: { user: { select: { name: true, image: true } } },
            },
          },
        },
        _count: { select: { siteEmployees: true, attendances: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.site.count({ where }),
  ]);

  return NextResponse.json({
    data: sites,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    success: true,
  });
}

// POST /api/sites
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSiteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const site = await prisma.site.create({ data: parsed.data });

  return NextResponse.json({ data: site, success: true }, { status: 201 });
}
