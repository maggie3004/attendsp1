import type { Metadata } from "next";
import AdminDashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "AttendSP Admin Dashboard - Workforce Overview",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
