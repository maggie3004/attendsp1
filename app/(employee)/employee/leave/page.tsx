"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarOff, Plus, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/validators";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

interface Leave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
}

export default function LeavePage() {
  const { data: session } = useSession();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
  });

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/leave?pageSize=20");
    const data = await res.json();
    if (data.success) setLeaves(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const onSubmit = async (data: LeaveRequestInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Leave request submitted!");
        setShowForm(false);
        reset();
        fetchLeaves();
      } else {
        toast.error(result.error ?? "Failed to submit");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const leaveTypeColors: Record<string, string> = {
    ANNUAL: "text-info-600",
    SICK: "text-danger-600",
    EMERGENCY: "text-warning-600",
    UNPAID: "text-neutral-600",
    OTHER: "text-purple-600",
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <CalendarOff className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary font-display">Leave Requests</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Apply
        </button>
      </div>

      {/* Leave Request Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white w-full rounded-t-3xl p-6 safe-bottom"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">Apply for Leave</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-neutral-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Leave Type</label>
                  <select className={`input w-full ${errors.leaveType ? "border-danger-400" : ""}`} {...register("leaveType")}>
                    <option value="">Select type</option>
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EMERGENCY">Emergency Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.leaveType && <p className="text-xs text-danger-500 mt-1">{errors.leaveType.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Start Date</label>
                    <input type="date" className={`input w-full ${errors.startDate ? "border-danger-400" : ""}`} {...register("startDate")} />
                    {errors.startDate && <p className="text-xs text-danger-500 mt-1">{errors.startDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">End Date</label>
                    <input type="date" className={`input w-full ${errors.endDate ? "border-danger-400" : ""}`} {...register("endDate")} />
                    {errors.endDate && <p className="text-xs text-danger-500 mt-1">{errors.endDate.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Explain your reason for leave..."
                    className={`input w-full h-auto py-2.5 ${errors.reason ? "border-danger-400" : ""}`}
                    {...register("reason")}
                  />
                  {errors.reason && <p className="text-xs text-danger-500 mt-1">{errors.reason.message}</p>}
                </div>
                <button type="submit" disabled={submitting} className="mobile-btn-primary">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="mobile-card skeleton h-24 rounded-2xl" />)}
        </div>
      ) : leaves.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <CalendarOff className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No leave requests yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leaves.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="mobile-card"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-sm font-semibold ${leaveTypeColors[l.leaveType] ?? "text-text-primary"}`}>
                  {l.leaveType.charAt(0) + l.leaveType.slice(1).toLowerCase()} Leave
                </span>
                <StatusBadge status={l.status} />
              </div>
              <p className="text-sm text-text-secondary">
                {formatDate(l.startDate)} – {formatDate(l.endDate)} · {l.totalDays} day{l.totalDays > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-text-muted mt-1 line-clamp-2">{l.reason}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
