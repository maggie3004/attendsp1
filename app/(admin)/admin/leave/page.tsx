"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarOff, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import EmptyState from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingStates";
import { formatDate, timeAgo } from "@/lib/utils";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
  employee: { user: { name: string; image: string | null } };
  approvedBy: { name: string } | null;
}

export default function LeaveRequestsPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      pageSize: "50",
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/leave?${params}`);
    const data = await res.json();
    if (data.success) {
      setLeaves(data.data);
      setTotal(data.total);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED", note?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(note && { rejectionNote: note }) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Leave request ${status.toLowerCase()}`);
        setRejectingId(null);
        setRejectionNote("");
        fetchLeaves();
      } else {
        toast.error(data.error ?? "Action failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const leaveTypeColors: Record<string, string> = {
    ANNUAL: "bg-info-50 text-info-600",
    SICK: "bg-danger-50 text-danger-600",
    EMERGENCY: "bg-warning-50 text-warning-600",
    UNPAID: "bg-neutral-100 text-neutral-600",
    OTHER: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leave Requests"
        subtitle={`${total} ${statusFilter.toLowerCase()} request${total !== 1 ? "s" : ""}`}
        icon={CalendarOff}
      />

      {/* Status Tabs */}
      <div className="flex items-center gap-2">
        {["PENDING", "APPROVED", "REJECTED", ""].map((s) => (
          <button
            key={s || "ALL"}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              statusFilter === s
                ? "bg-primary text-white shadow-button"
                : "bg-white border border-border text-text-secondary hover:bg-neutral-50"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : leaves.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarOff}
            title={`No ${statusFilter.toLowerCase() || ""} leave requests`}
            description="Leave requests will appear here"
          />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave.id} className="card">
              <div className="flex items-start gap-4">
                <Avatar name={leave.employee.user.name} image={leave.employee.user.image} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-text-primary">{leave.employee.user.name}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${leaveTypeColors[leave.leaveType] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {leave.leaveType}
                    </span>
                    <StatusBadge status={leave.status} />
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">{leave.reason}</p>
                  <p className="text-xs text-text-muted mt-1">{timeAgo(leave.createdAt)}</p>

                  {/* Rejection Note Input */}
                  {rejectingId === leave.id && (
                    <div className="mt-3">
                      <input
                        placeholder="Reason for rejection (optional)"
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        className="input w-full max-w-sm text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                {leave.status === "PENDING" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(leave.id, "APPROVED")}
                      disabled={actionLoading === leave.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-success-50 text-success-700 border border-success-200 rounded-lg text-xs font-medium hover:bg-success-100 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    {rejectingId === leave.id ? (
                      <button
                        onClick={() => handleAction(leave.id, "REJECTED", rejectionNote)}
                        disabled={actionLoading === leave.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-500 text-white rounded-lg text-xs font-medium hover:bg-danger-600 transition-colors"
                      >
                        Confirm Reject
                      </button>
                    ) : (
                      <button
                        onClick={() => setRejectingId(leave.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg text-xs font-medium hover:bg-danger-100 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
