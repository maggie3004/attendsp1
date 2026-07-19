"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import BottomNav from "@/components/employee/BottomNav";

function EmployeeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Mobile-first content with max width */}
      <div className="max-w-lg mx-auto min-h-screen bg-background">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <EmployeeShell>{children}</EmployeeShell>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            fontSize: "14px",
          },
        }}
      />
    </SessionProvider>
  );
}
