"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import Sidebar from "@/components/admin/Sidebar";
import TopNavbar from "@/components/admin/TopNavbar";
import { cn } from "@/lib/utils";

function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopNavbar
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={() => setCollapsed(!collapsed)}
      />
      <main
        className={cn(
          "transition-all duration-250 pt-16",
          collapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
          },
        }}
      />
    </SessionProvider>
  );
}
