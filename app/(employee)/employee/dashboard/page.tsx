"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin, Clock, CheckCircle2, AlertCircle, Calendar,
  ArrowRight, Bell, HardHat,
} from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatTime, formatDate } from "@/lib/utils";

interface TodayStatus {
  marked: boolean;
  status: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  site: { name: string } | null;
}

interface AssignedSite {
  id: string;
  name: string;
  location: string;
}

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [time, setTime] = useState(new Date());
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({ marked: false, status: null, checkInTime: null, checkOutTime: null });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [assignedSite, setAssignedSite] = useState<AssignedSite | null>(null);
  const [settings, setSettings] = useState<{ workStartTime: string, workEndTime: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchData = async () => {
      try {
        const [attendRes, siteRes, settingsRes] = await Promise.all([
          fetch(`/api/attendance?pageSize=10&employeeId=${session.user.employeeId}`, { cache: "no-store" }),
          fetch(`/api/employees/${session.user.employeeId}`, { cache: "no-store" }),
          fetch(`/api/settings`, { cache: "no-store" }),
        ]);
        const [attendData, empData, settingsData] = await Promise.all([attendRes.json(), siteRes.json(), settingsRes.json()]);

        if (attendData.success) {
          const records: AttendanceRecord[] = attendData.data;
          const todayStr = format(new Date(), "yyyy-MM-dd");
          const todayRecord = records.find((r) => {
            if (r.checkInTime) {
              const checkIn = new Date(r.checkInTime);
              const now = new Date();
              return checkIn.getDate() === now.getDate() &&
                     checkIn.getMonth() === now.getMonth() &&
                     checkIn.getFullYear() === now.getFullYear();
            }
            return format(new Date(r.date), "yyyy-MM-dd") === todayStr;
          });
          if (todayRecord) {
            setTodayStatus({ marked: true, status: todayRecord.status, checkInTime: todayRecord.checkInTime, checkOutTime: todayRecord.checkOutTime });
          }
          setRecentAttendance(records.slice(0, 3));
        }

        if (empData.success && empData.data.siteEmployees?.[0]) {
          setAssignedSite(empData.data.siteEmployees[0].site);
        }

        if (settingsData.success) {
          setSettings(settingsData.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatShiftTime = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const calculateOvertime = () => {
    if (!todayStatus.checkInTime || !todayStatus.checkOutTime || !settings?.workEndTime) return null;
    
    const checkOut = new Date(todayStatus.checkOutTime);
    // Parse work end time to local date
    const [endH, endM] = settings.workEndTime.split(':').map(Number);
    const shiftEnd = new Date(todayStatus.checkOutTime);
    shiftEnd.setHours(endH, endM, 0, 0);

    const diffMs = checkOut.getTime() - shiftEnd.getTime();
    if (diffMs <= 0) return null; // No overtime

    const totalMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    
    return `${hours}h ${mins}m`;
  };

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-text-primary font-display text-lg">AttendSP</span>
        </div>
        <Link href="/employee/profile" className="relative p-2 rounded-xl hover:bg-neutral-100 transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
        </Link>
      </div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-text-muted text-sm">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-text-primary font-display">{firstName} 👷</h1>
      </motion.div>

      {/* Date & Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-button"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm font-medium">{format(time, "EEEE")}</p>
            <p className="text-2xl font-bold font-display mt-0.5">{format(time, "dd MMMM yyyy")}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-display tabular-nums">
              {mounted ? format(time, "hh:mm") : "--:--"}
            </p>
            <p className="text-primary-200 text-sm">
              {mounted ? `${format(time, "ss")}s · ${format(time, "a")}` : "--s · --"}
            </p>
          </div>
        </div>

        {/* Site Info */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-200" />
            <span className="text-sm text-primary-100">
              {loading ? "Loading site..." : assignedSite ? assignedSite.name : "No site assigned"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-4 h-4 text-primary-200" />
            <span className="text-sm text-primary-100">
              Shift: {settings ? `${formatShiftTime(settings.workStartTime)} – ${formatShiftTime(settings.workEndTime)}` : "Loading..."}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Today's Attendance Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`rounded-2xl p-4 flex flex-col gap-3 ${
          todayStatus.marked
            ? "bg-success-50 border border-success-200"
            : "bg-warning-50 border border-warning-200"
        }`}
      >
        <div className="flex items-center gap-4">
          {todayStatus.marked ? (
            <CheckCircle2 className="w-8 h-8 text-success-500 shrink-0" />
          ) : (
            <AlertCircle className="w-8 h-8 text-warning-500 shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-text-primary text-sm">
              {todayStatus.marked ? "Attendance Marked" : "Not Marked Yet"}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {todayStatus.marked
                ? `Checked in at ${todayStatus.checkInTime ? formatTime(todayStatus.checkInTime) : "--"}`
                : "Don't forget to mark your attendance today"}
            </p>
          </div>
          {todayStatus.marked && todayStatus.status && (
            <StatusBadge status={todayStatus.status} />
          )}
        </div>
        
        {/* Additional details for Check Out & Overtime */}
        {todayStatus.marked && todayStatus.checkOutTime && (
          <div className="pt-3 mt-1 border-t border-success-200/50 flex flex-col gap-1">
             <div className="flex justify-between items-center text-sm">
                <span className="text-success-800">Checked Out</span>
                <span className="font-medium text-success-900">{formatTime(todayStatus.checkOutTime)}</span>
             </div>
             {calculateOvertime() && (
               <div className="flex justify-between items-center text-sm">
                  <span className="text-success-800">Overtime</span>
                  <span className="font-bold text-success-900 bg-success-200/50 px-2 rounded-md">{calculateOvertime()}</span>
               </div>
             )}
          </div>
        )}
      </motion.div>

      {/* Mark Attendance Button */}
      {(!todayStatus.marked || !todayStatus.checkOutTime) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/employee/attendance/mark"
            className="mobile-btn-primary"
          >
            <CheckCircle2 className="w-6 h-6" />
            {!todayStatus.marked ? "Check In" : "Check Out"}
          </Link>
        </motion.div>
      )}

      {/* Recent Attendance */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mobile-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Recent Attendance</h2>
          <Link href="/employee/attendance" className="flex items-center gap-1 text-xs text-primary font-medium">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : recentAttendance.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No records yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAttendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{formatDate(record.date)}</p>
                  <p className="text-xs text-text-muted">
                    {record.site?.name ?? "No site"} · {record.checkInTime ? formatTime(record.checkInTime) : "--"}
                  </p>
                </div>
                <StatusBadge status={record.status} />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
