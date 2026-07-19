"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, User, ChevronDown, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TopNavbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

export default function TopNavbar({ sidebarCollapsed, onMobileMenuToggle }: TopNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications?pageSize=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(console.error);
  }, []);

  const getBreadcrumb = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments
      .slice(1)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
      .join(" › ");
  };

  const name = session?.user?.name ?? "Admin";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-border z-20",
        "flex items-center px-6 gap-4 transition-all duration-250",
        "left-0 lg:left-[260px]",
        sidebarCollapsed && "lg:left-[72px]"
      )}
    >
      {/* Mobile Menu */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden btn-ghost p-2 -ml-2"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1">
        <p className="text-sm text-text-muted">Admin Portal</p>
        <p className="text-sm font-semibold text-text-primary capitalize">
          {getBreadcrumb() || "Dashboard"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          href="/admin/notifications"
          className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Profile menu"
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
                {getInitials(name)}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text-primary leading-none">{name}</p>
              <p className="text-xs text-text-muted leading-none mt-0.5">Administrator</p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted hidden md:block" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-border shadow-modal z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-text-primary">{name}</p>
                  <p className="text-xs text-text-muted">{session?.user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/admin/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-50 hover:text-text-primary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
