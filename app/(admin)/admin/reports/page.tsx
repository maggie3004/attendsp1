"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText, Users, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import { exportToCSV, formatDate } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";

type ReportType = "daily" | "monthly" | "employee" | "site";

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [employees, setEmployees] = useState<{ id: string, name: string }[]>([]);
  const [sites, setSites] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [empRes, siteRes] = await Promise.all([
          fetch("/api/employees?pageSize=1000"),
          fetch("/api/sites?pageSize=1000")
        ]);
        const empData = await empRes.json();
        const siteData = await siteRes.json();
        
        if (empData.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setEmployees(empData.data.map((e: any) => ({ id: e.id, name: e.user.name })));
        }
        if (siteData.success) {
          setSites(siteData.data);
        }
      } catch (err) {
        console.error("Failed to fetch options", err);
      }
    };
    fetchOptions();
  }, []);

  const reportTypes = [
    { id: "daily" as ReportType, label: "Daily Attendance", icon: Calendar, description: "Attendance for a specific date range" },
    { id: "monthly" as ReportType, label: "Monthly Report", icon: BarChart3, description: "Full month attendance summary" },
    { id: "employee" as ReportType, label: "Employee Report", icon: Users, description: "Per-employee attendance history" },
    { id: "site" as ReportType, label: "Site Report", icon: MapPin, description: "Attendance by construction site" },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      let url = "/api/attendance?pageSize=1000";

      if (activeReport === "daily") {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else if (activeReport === "monthly") {
        const start = format(startOfMonth(new Date(month)), "yyyy-MM-dd");
        const end = format(endOfMonth(new Date(month)), "yyyy-MM-dd");
        url += `&startDate=${start}&endDate=${end}`;
      } else if (activeReport === "employee") {
        url += `&startDate=${startDate}&endDate=${endDate}`;
        if (selectedEmployee) url += `&employeeId=${selectedEmployee}`;
      } else if (activeReport === "site") {
        url += `&startDate=${startDate}&endDate=${endDate}`;
        if (selectedSite) url += `&siteId=${selectedSite}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        toast.error("Failed to generate report");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = data.data.map((a: any) => ({
        Date: formatDate(a.date),
        "Employee Code": a.employee.employeeCode ?? "-",
        "Employee Name": a.employee.user.name,
        Designation: a.employee.designation ?? "-",
        Department: a.employee.department ?? "-",
        Status: a.status,
        Site: a.site?.name ?? "-",
        "Check In": a.checkInTime ? format(new Date(a.checkInTime), "hh:mm a") : "-",
        "Check Out": a.checkOutTime ? format(new Date(a.checkOutTime), "hh:mm a") : "-",
        Source: a.isManual ? "Manual" : "App",
      }));

      if (rows.length === 0) {
        toast.info("No data found for the selected period");
        return;
      }

      exportToCSV(rows, `${activeReport}-report`);
      toast.success(`Report exported (${rows.length} records)`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Export attendance data in CSV format"
        icon={BarChart3}
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {reportTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setActiveReport(rt.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
              activeReport === rt.id
                ? "border-primary bg-primary-50"
                : "border-border bg-white hover:border-neutral-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              activeReport === rt.id ? "bg-primary text-white" : "bg-neutral-100 text-neutral-500"
            }`}>
              <rt.icon className="w-5 h-5" />
            </div>
            <p className={`text-sm font-semibold ${activeReport === rt.id ? "text-primary" : "text-text-primary"}`}>
              {rt.label}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{rt.description}</p>
          </button>
        ))}
      </div>

      <motion.div
        key={activeReport}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {reportTypes.find((r) => r.id === activeReport)?.label}
            </h2>
            <p className="text-xs text-text-secondary">Configure and export your report</p>
          </div>
        </div>

        <div className="space-y-4">
          {(activeReport === "daily" || activeReport === "employee" || activeReport === "site") && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          )}

          {activeReport === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Select Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="input w-full max-w-xs"
              />
            </div>
          )}

          {activeReport === "employee" && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Select Employee (Optional)</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="input w-full"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeReport === "site" && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Select Site (Optional)</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="input w-full"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary btn-md"
          >
            {loading ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>
            ) : (
              <><Download className="w-4 h-4" />Export CSV</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
