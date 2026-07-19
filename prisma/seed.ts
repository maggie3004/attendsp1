import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin User
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@attendsp.com" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@attendsp.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create Sample Sites
  const site1 = await prisma.site.upsert({
    where: { id: "site-001" },
    update: {},
    create: {
      id: "site-001",
      name: "Downtown Tower Block A",
      location: "Chennai, Tamil Nadu",
      address: "123, Anna Salai, Chennai - 600002",
      latitude: 13.0827,
      longitude: 80.2707,
      radius: 200,
      status: "ACTIVE",
    },
  });

  const site2 = await prisma.site.upsert({
    where: { id: "site-002" },
    update: {},
    create: {
      id: "site-002",
      name: "Harbor Bridge Extension",
      location: "Mumbai, Maharashtra",
      address: "Marine Drive, Mumbai - 400020",
      latitude: 18.9432,
      longitude: 72.8236,
      radius: 300,
      status: "ACTIVE",
    },
  });
  console.log("✅ Sites created:", site1.name, site2.name);

  // Create Sample Employee
  const empPassword = await bcrypt.hash("Employee@1234", 12);
  const empUser = await prisma.user.upsert({
    where: { email: "john.doe@attendsp.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john.doe@attendsp.com",
      password: empPassword,
      role: "EMPLOYEE",
      employee: {
        create: {
          employeeCode: "EMP-1001",
          designation: "Site Engineer",
          department: "Civil Works",
          phone: "+91 98765 43210",
          status: "ACTIVE",
          siteEmployees: {
            create: { siteId: site1.id, isActive: true },
          },
        },
      },
    },
    include: { employee: true },
  });
  console.log("✅ Sample employee created:", empUser.email);

  // Welcome notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: "Welcome to AttendSP",
        message: "Your admin account is ready. Start by adding employees and sites.",
        type: "SYSTEM",
      },
      {
        userId: empUser.id,
        title: "Welcome to AttendSP",
        message: "Your employee account has been created. Employee code: EMP-1001",
        type: "SYSTEM",
      },
    ],
  });

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("=".repeat(50));
  console.log("Admin Login:");
  console.log("  Email:    admin@attendsp.com");
  console.log("  Password: Admin@1234");
  console.log("\nEmployee Login:");
  console.log("  Email:    john.doe@attendsp.com");
  console.log("  Password: Employee@1234");
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
