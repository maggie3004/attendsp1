"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Mail, Phone, MapPin, Briefcase, Building2,
  Edit2, Trash2, ArrowLeft, Calendar, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Avatar from "@/components/shared/Avatar";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { PageLoader } from "@/components/shared/LoadingStates";

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  department: string;
  phone: string | null;
  address: string | null;
  status: string;
  joinDate: string;
  user: { name: string; email: string; image: string | null };
  siteEmployees: Array<{ site: { id: string; name: string; location: string } }>;
  attendances: Array<{ id: string; date: string; status: string; checkInTime: string | null; site: { name: string } | null }>;
  leaves: Array<{ id: string; leaveType: string; startDate: string; endDate: string; status: string; totalDays: number }>;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/employees/${params.id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setEmployee(res.data); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Delete this employee? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${params.id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Employee deleted");
        router.push("/admin/employees");
      } else {
        toast.error(result.error ?? "Delete failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!employee) return <div className="card text-center py-12 text-text-secondary">Employee not found</div>;

  const recentAttendance = employee.attendances.slice(0, 10);
  const presentCount = employee.attendances.filter((a) => a.status === "PRESENT").length;
  const lateCount = employee.attendances.filter((a) => a.status === "LATE").length;

  return (
    <div className="space-y-5">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href="/admin/employees" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/admin/employees/${params.id}/edit`} className="btn-secondary btn-sm">
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger btn-sm">
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="card lg:col-span-1 flex flex-col items-center text-center">
          <Avatar name={employee.user.name} image={employee.user.image} size="xl" className="mb-3" />
          <h2 className="text-lg font-bold text-text-primary">{employee.user.name}</h2>
          <p className="text-sm text-text-secondary">{employee.designation}</p>
          <span className="text-xs font-mono bg-neutral-100 px-2.5 py-0.5 rounded mt-1.5">{employee.employeeCode}</span>
          <div className="mt-3"><StatusBadge status={employee.status} /></div>

          <div className="mt-5 w-full space-y-3 text-left">
            {[
              { icon: Mail, label: employee.user.email },
              { icon: Phone, label: employee.phone ?? "No phone" },
              { icon: Building2, label: employee.department },
              { icon: MapPin, label: employee.siteEmployees[0]?.site.name ?? "Unassigned" },
              { icon: Calendar, label: `Joined ${formatDate(employee.joinDate)}` },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Icon className="w-4 h-4 text-text-muted shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats + Attendance */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Days", value: employee.attendances.length, color: "text-primary" },
              { label: "Present", value: presentCount, color: "text-success-600" },
              { label: "Late", value: lateCount, color: "text-warning-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Recent Attendance */}
          <div className="card">
            <h3 className="text-base font-semibold text-text-primary mb-4">Recent Attendance (Last 30 days)</h3>
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">No attendance records</p>
            ) : (
              <div className="space-y-2.5">
                {recentAttendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{formatDate(a.date)}</p>
                      <p className="text-xs text-text-muted">{a.site?.name ?? "No site"} · {a.checkInTime ? formatTime(a.checkInTime) : "—"}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave History */}
          {employee.leaves.length > 0 && (
            <div className="card">
              <h3 className="text-base font-semibold text-text-primary mb-4">Leave History</h3>
              <div className="space-y-2">
                {employee.leaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{l.leaveType} Leave</p>
                      <p className="text-xs text-text-muted">{formatDate(l.startDate)} – {formatDate(l.endDate)} · {l.totalDays} days</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
