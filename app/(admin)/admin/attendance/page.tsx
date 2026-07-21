"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, ClipboardCheck } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import EmptyState from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingStates";
import { formatDate, formatTime, exportToCSV } from "@/lib/utils";

interface Attendance {
  id: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  isManual: boolean;
  employee: { user: { name: string; image: string | null } };
  site: { name: string } | null;
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const debouncedSearch = useDebounce(search, 400);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter && { status: statusFilter }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    const res = await fetch(`/api/attendance?${params}`);
    const data = await res.json();
    if (data.success) {
      setAttendances(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, debouncedSearch, statusFilter, startDate, endDate]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, startDate, endDate]);

  const handleExport = () => {
    exportToCSV(
      attendances.map((a) => ({
        Date: formatDate(a.date),
        Employee: a.employee.user.name,
        Status: a.status,
        Site: a.site?.name ?? "-",
        "Check In": a.checkInTime ? formatTime(a.checkInTime) : "-",
        "Check Out": a.checkOutTime ? formatTime(a.checkOutTime) : "-",
        Type: a.isManual ? "Manual" : "App",
      })),
      "attendance-report"
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        subtitle={`${total} records`}
        icon={ClipboardCheck}
        actions={
          <button onClick={handleExport} className="btn-secondary btn-md">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        }
      />

      <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-3">
        <div className="relative w-full md:flex-1 md:min-w-[180px] md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            placeholder="Search by employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full md:w-auto">
          <option value="">All Status</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
          <option value="HALF_DAY">Half Day</option>
        </select>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-text-muted w-10 sm:hidden">From</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input flex-1 sm:w-[150px] md:w-auto" />
          </div>
          <span className="text-text-muted text-sm shrink-0 hidden sm:block">to</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-text-muted w-10 sm:hidden">To</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input flex-1 sm:w-[150px] md:w-auto" />
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : attendances.length === 0 ? (
        <div className="card">
          <EmptyState icon={ClipboardCheck} title="No attendance records found" description="Try adjusting your filters" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">Date</th>
                <th className="table-th">Status</th>
                <th className="table-th">Site</th>
                <th className="table-th">Check In</th>
                <th className="table-th">Check Out</th>
                <th className="table-th">Type</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.employee.user.name} image={a.employee.user.image} size="xs" />
                      <span className="text-sm font-medium text-text-primary">{a.employee.user.name}</span>
                    </div>
                  </td>
                  <td className="table-td text-sm text-text-secondary">{formatDate(a.date)}</td>
                  <td className="table-td"><StatusBadge status={a.status} /></td>
                  <td className="table-td text-sm text-text-secondary">{a.site?.name ?? "—"}</td>
                  <td className="table-td text-sm text-text-secondary">{a.checkInTime ? formatTime(a.checkInTime) : "—"}</td>
                  <td className="table-td text-sm text-text-secondary">{a.checkOutTime ? formatTime(a.checkOutTime) : "—"}</td>
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.isManual ? "bg-warning-50 text-warning-600" : "bg-neutral-100 text-text-secondary"}`}>
                      {a.isManual ? "Manual" : "App"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-text-secondary">Page {page} of {totalPages} · {total} total</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">Next</button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
