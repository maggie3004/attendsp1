"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Download } from "lucide-react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import EmptyState from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingStates";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  department: string;
  status: string;
  joinDate: string;
  user: { name: string; email: string; image: string | null };
  siteEmployees: Array<{ site: { name: string; location: string } }>;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "10",
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter && { status: statusFilter }),
    });

    const res = await fetch(`/api/employees?${params}`);
    const data = await res.json();
    if (data.success) {
      setEmployees(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        subtitle={`${total} employee${total !== 1 ? "s" : ""} total`}
        icon={Users}
        actions={
          <Link href="/admin/employees/new" className="btn-primary btn-md">
            <Plus className="w-4 h-4" />
            Add Employee
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
            id="employee-search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
          id="status-filter"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : employees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No employees found"
            description={search ? "Try adjusting your search terms" : "Add your first employee to get started"}
            action={
              <Link href="/admin/employees/new" className="btn-primary btn-md">
                <Plus className="w-4 h-4" /> Add Employee
              </Link>
            }
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="table-container"
        >
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">Code</th>
                <th className="table-th">Designation</th>
                <th className="table-th">Department</th>
                <th className="table-th">Assigned Site</th>
                <th className="table-th">Status</th>
                <th className="table-th">Joined</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.user.name} image={emp.user.image} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{emp.user.name}</p>
                        <p className="text-xs text-text-muted">{emp.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs bg-neutral-100 px-2 py-0.5 rounded">
                      {emp.employeeCode}
                    </span>
                  </td>
                  <td className="table-td text-sm text-text-secondary">{emp.designation}</td>
                  <td className="table-td text-sm text-text-secondary">{emp.department}</td>
                  <td className="table-td text-sm text-text-secondary">
                    {emp.siteEmployees[0]?.site.name ?? (
                      <span className="text-text-muted italic">Unassigned</span>
                    )}
                  </td>
                  <td className="table-td">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="table-td text-sm text-text-secondary">
                    {formatDate(emp.joinDate)}
                  </td>
                  <td className="table-td">
                    <Link
                      href={`/admin/employees/${emp.id}`}
                      className="text-xs font-medium text-primary hover:text-primary-hover"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-text-secondary">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
