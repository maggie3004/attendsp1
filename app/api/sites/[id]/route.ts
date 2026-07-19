import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSiteSchema } from "@/lib/validators";

// GET /api/sites/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      siteEmployees: {
        where: { isActive: true },
        include: {
          employee: {
            include: { user: { select: { name: true, email: true, image: true } } },
          },
        },
      },
      _count: { select: { attendances: true, siteEmployees: true } },
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  return NextResponse.json({ data: site, success: true });
}

// PUT /api/sites/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = createSiteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const site = await prisma.site.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: site, success: true });
}

// DELETE /api/sites/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.site.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Site deleted" });
}
