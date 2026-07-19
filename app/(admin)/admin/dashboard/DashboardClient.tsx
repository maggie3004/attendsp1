"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, CheckCircle2, XCircle, Clock, CalendarOff,
  MapPin, Bell, Plus, ArrowRight, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import { CardSkeleton, PageLoader } from "@/components/shared/LoadingStates";
import { formatTime, timeAgo } from "@/lib/utils";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  activeSites: number;
  pendingLeaveRequests: number;
  recentAttendances: Array<{
    id: string;
    status: string;
    checkInTime: string | null;
    employee: { user: { name: string; image: string | null } };
    site: { name: string } | null;
  }>;
  recentLeaves: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    employee: { user: { name: string; image: string | null } };
  }>;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: string;
  href?: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor, change, href }: StatCardProps) {
  const content = (
    <div className="card h-full hover:shadow-card-hover transition-all duration-200 cursor-pointer group flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-text-secondary font-medium leading-tight">{label}</p>
          <p className="text-3xl font-bold text-text-primary mt-2 font-display">{value}</p>
          {change && (
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {change}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 shrink-0 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return <div className="h-full">{content}</div>;
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), "EEEE, dd MMMM yyyy");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">{today}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/employees/new" className="btn-primary btn-md">
            <Plus className="w-4 h-4" />
            Add Employee
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          <StatCard
            label="Total Employees"
            value={stats?.totalEmployees ?? 0}
            icon={Users}
            color="text-primary"
            bgColor="bg-primary-50"
            href="/admin/employees"
          />
          <StatCard
            label="Present Today"
            value={stats?.presentToday ?? 0}
            icon={CheckCircle2}
            color="text-success-600"
            bgColor="bg-success-50"
            href="/admin/attendance"
          />
          <StatCard
            label="Absent Today"
            value={stats?.absentToday ?? 0}
            icon={XCircle}
            color="text-danger-600"
            bgColor="bg-danger-50"
            href="/admin/attendance"
          />
          <StatCard
            label="Late Today"
            value={stats?.lateToday ?? 0}
            icon={Clock}
            color="text-warning-600"
            bgColor="bg-warning-50"
            href="/admin/attendance"
          />
          <StatCard
            label="On Leave"
            value={stats?.onLeaveToday ?? 0}
            icon={CalendarOff}
            color="text-purple-600"
            bgColor="bg-purple-50"
            href="/admin/leave"
          />
          <StatCard
            label="Active Sites"
            value={stats?.activeSites ?? 0}
            icon={MapPin}
            color="text-info-600"
            bgColor="bg-info-50"
            href="/admin/sites"
          />
        </motion.div>
      )}

      {/* Pending Alert */}
      {stats && stats.pendingLeaveRequests > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between p-4 bg-warning-50 border border-warning-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-warning-100 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warning-700">
                {stats.pendingLeaveRequests} Pending Leave Request{stats.pendingLeaveRequests > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-warning-600">Review and take action</p>
            </div>
          </div>
          <Link
            href="/admin/leave"
            className="btn-sm btn-secondary text-warning-700 border-warning-200 hover:bg-warning-100"
          >
            Review <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Today's Attendance</h2>
            <Link
              href="/admin/attendance"
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-9 h-9 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-3.5 w-32 rounded mb-1.5" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : stats?.recentAttendances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-neutral-300 mb-2" />
              <p className="text-sm text-text-secondary">No attendance recorded yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentAttendances.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <Avatar name={a.employee.user.name} image={a.employee.user.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {a.employee.user.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {a.site?.name ?? "No site"} · {a.checkInTime ? formatTime(a.checkInTime) : "--"}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Pending Leave Requests</h2>
            <Link
              href="/admin/leave"
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-9 h-9 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-3.5 w-28 rounded mb-1.5" />
                    <div className="skeleton h-3 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarOff className="w-10 h-10 text-neutral-300 mb-2" />
              <p className="text-sm text-text-secondary">No pending leave requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentLeaves.map((l) => (
                <div key={l.id} className="flex items-center gap-3">
                  <Avatar name={l.employee.user.name} image={l.employee.user.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {l.employee.user.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {l.leaveType} · {l.totalDays} day{l.totalDays > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/admin/leave`}
                    className="text-xs text-primary font-medium hover:text-primary-hover"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-base font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Employee", href: "/admin/employees/new", icon: Users, color: "bg-primary-50 text-primary" },
            { label: "Add Site", href: "/admin/sites/new", icon: MapPin, color: "bg-info-50 text-info-600" },
            { label: "View Attendance", href: "/admin/attendance", icon: CheckCircle2, color: "bg-success-50 text-success-600" },
            { label: "View Reports", href: "/admin/reports", icon: TrendingUp, color: "bg-warning-50 text-warning-600" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border
                         hover:border-primary hover:bg-primary-50/30 transition-all duration-150 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-text-secondary group-hover:text-primary transition-colors text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
