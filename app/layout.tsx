import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AttendSP – Workforce Attendance Management",
    template: "%s | AttendSP",
  },
  description:
    "AttendSP is a professional workforce attendance management system for construction companies. Track employee attendance, manage sites, and streamline workforce operations.",
  keywords: [
    "attendance management",
    "workforce tracking",
    "construction workforce",
    "employee attendance",
  ],
  authors: [{ name: "AttendSP" }],
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
