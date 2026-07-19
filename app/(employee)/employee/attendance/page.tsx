"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ClipboardCheck, Calendar, Clock } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { PageLoader } from "@/components/shared/LoadingStates";

interface Attendance {
  id: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  site: { name: string } | null;
}

export default function AttendanceHistoryPage() {
  const { data: session } = useSession();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!session?.user?.employeeId) return;
    setLoading(true);
    const res = await window.fetch(
      `/api/attendance?employeeId=${session.user.employeeId}&page=${page}&pageSize=15`
    );
    const data = await res.json();
    if (data.success) {
      setAttendances(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [session, page]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading && page === 1) return <PageLoader />;

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display">Attendance History</h1>
          <p className="text-xs text-text-secondary">{total} records</p>
        </div>
      </div>

      {attendances.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <ClipboardCheck className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No attendance records yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {attendances.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="mobile-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{formatDate(a.date)}</p>
                    <p className="text-xs text-text-secondary">
                      {a.site?.name ?? "No site"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-text-muted border-t border-border pt-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  In: {a.checkInTime ? formatTime(a.checkInTime) : "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Out: {a.checkOutTime ? formatTime(a.checkOutTime) : "—"}
                </span>
              </div>
            </motion.div>
          ))}

          {totalPages > 1 && (
            <div className="flex gap-3 pt-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex-1 btn-secondary btn-md"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex-1 btn-secondary btn-md"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
