"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarOff, Plus, X, Wallet, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/validators";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

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

interface LeaveBalance {
  totalAccrued: number;
  usedPaid: number;
  usedAdvance: number;
  currentBalance: number;
  monthsEmployed: number;
}

export default function LeavePage() {
  const { data: session } = useSession();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMultipleDays, setIsMultipleDays] = useState(false);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
  });

  const startDate = useWatch({ control, name: "startDate" });
  const endDate = useWatch({ control, name: "endDate" });

  useEffect(() => {
    if (!isMultipleDays && startDate) {
      setValue("endDate", startDate, { shouldValidate: true });
    }
  }, [startDate, isMultipleDays, setValue]);

  // Basic calculation of days just for frontend feedback
  const getRequestedDays = () => {
    if (!isMultipleDays) return startDate ? 1 : 0;
    if (!startDate || !endDate) return 0;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (end < start) return 0;
    return differenceInDays(end, start) + 1; // inclusive
  };

  const requestedDays = getRequestedDays();
  const hasEnoughBalance = balance ? balance.currentBalance >= requestedDays : false;

  const fetchData = useCallback(async () => {
    if (!session?.user?.employeeId) return;
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        fetch("/api/leave?pageSize=20"),
        fetch(`/api/leaves/balance?employeeId=${session.user.employeeId}`)
      ]);
      const leavesData = await leavesRes.json();
      const balanceData = await balanceRes.json();

      if (leavesData.success) setLeaves(leavesData.data);
      if (balanceData.success) setBalance(balanceData.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: LeaveRequestInput) => {
    if (!isMultipleDays) {
      data.endDate = data.startDate;
    }

    if (data.leaveType === "PAID" && balance && balance.currentBalance < requestedDays) {
      toast.error(`Not enough balance. You have ${balance.currentBalance} days, but requested ${requestedDays}.`);
      return;
    }

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
        fetchData();
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
    PAID: "text-success-600",
    ADVANCE: "text-warning-600",
    UNPAID: "text-neutral-500",
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <CalendarOff className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary font-display">Leaves</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Apply
        </button>
      </div>

      {/* Balance Ledger Summary */}
      {!loading && balance && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 text-white shadow-button">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-primary-200" />
            <h2 className="font-semibold">Leave Balance Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-primary-200 text-sm">Credited this month</p>
              <p className="text-2xl font-bold mt-0.5">{balance.totalAccrued} <span className="text-sm font-normal opacity-80">days</span></p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">Available Balance</p>
              <p className={`text-2xl font-bold mt-0.5 ${balance.currentBalance <= 0 ? "text-warning-300" : "text-white"}`}>
                {balance.currentBalance} <span className="text-sm font-normal opacity-80">days</span>
              </p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">Used Paid Leaves</p>
              <p className="text-2xl font-bold mt-0.5">{balance.usedPaid} <span className="text-sm font-normal opacity-80">days</span></p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">Advance Leaves</p>
              <p className="text-2xl font-bold mt-0.5">{balance.usedAdvance} <span className="text-sm font-normal opacity-80">days</span></p>
            </div>
          </div>
        </motion.div>
      )}

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
              className="bg-white w-full rounded-t-3xl p-6 safe-bottom max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">Apply for Leave</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-neutral-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex bg-neutral-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setIsMultipleDays(false)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${!isMultipleDays ? "bg-white text-primary shadow-sm" : "text-text-secondary"}`}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMultipleDays(true)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${isMultipleDays ? "bg-white text-primary shadow-sm" : "text-text-secondary"}`}
                  >
                    Joint Leaves
                  </button>
                </div>

                {!isMultipleDays ? (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Date</label>
                    <input type="date" className={`input w-full ${errors.startDate ? "border-danger-400" : ""}`} {...register("startDate")} />
                    {errors.startDate && <p className="text-xs text-danger-500 mt-1">{errors.startDate.message}</p>}
                    <input type="hidden" {...register("endDate")} />
                  </div>
                ) : (
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
                )}

                {requestedDays > 0 && (
                  <div className="p-3 bg-neutral-50 rounded-xl flex items-start gap-2 border border-border">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary">
                      You are requesting <strong>{requestedDays}</strong> day{requestedDays > 1 ? "s" : ""} of leave.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Leave Option</label>
                  <select className={`input w-full ${errors.leaveType ? "border-danger-400" : ""}`} {...register("leaveType")}>
                    <option value="">Select option...</option>
                    <option value="PAID" disabled={!hasEnoughBalance}>
                      Paid Leave {!hasEnoughBalance && "(Not enough balance)"}
                    </option>
                    <option value="UNPAID">Leave Without Pay</option>
                    <option value="ADVANCE">Advance Leave (Deduct from next month's credit)</option>
                  </select>
                  {errors.leaveType && <p className="text-xs text-danger-500 mt-1">{errors.leaveType.message}</p>}
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
                <button type="submit" disabled={submitting} className="mobile-btn-primary w-full">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave List */}
      <h3 className="text-sm font-semibold text-text-primary mt-6 mb-2 flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" /> Request History
      </h3>
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
                  {l.leaveType === "ADVANCE" ? "Advance (Next Month)" : l.leaveType === "PAID" ? "Paid Leave" : "Leave Without Pay"}
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
