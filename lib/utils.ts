import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance, parseISO, isToday, isYesterday } from "date-fns";

// ---- Tailwind Class Merger ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Date Formatters ----
export function formatDate(date: Date | string, pattern = "dd MMM yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "hh:mm a");
}

export function formatRelativeTime(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return `Today, ${format(d, "hh:mm a")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "hh:mm a")}`;
  return format(d, "dd MMM, hh:mm a");
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true });
}

// ---- String Utilities ----
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateEmployeeCode(): string {
  const prefix = "EMP";
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${number}`;
}

// ---- Number Utilities ----
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

// ---- Attendance Status ----
export function getAttendanceStatusColor(status: string) {
  const map: Record<string, string> = {
    PRESENT: "text-success-600 bg-success-50 border-success-200",
    ABSENT: "text-danger-600 bg-danger-50 border-danger-200",
    LATE: "text-warning-600 bg-warning-50 border-warning-200",
    HALF_DAY: "text-info-600 bg-info-50 border-info-200",
    LEAVE: "text-purple-600 bg-purple-50 border-purple-200",
  };
  return map[status] ?? "text-neutral-600 bg-neutral-50 border-neutral-200";
}

export function getLeaveStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: "text-info-600 bg-info-50 border-info-200",
    APPROVED: "text-success-600 bg-success-50 border-success-200",
    REJECTED: "text-danger-600 bg-danger-50 border-danger-200",
    CANCELLED: "text-neutral-600 bg-neutral-50 border-neutral-200",
  };
  return map[status] ?? "text-neutral-600 bg-neutral-50 border-neutral-200";
}

// ---- CSV Export ----
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---- API Helpers ----
export function buildQueryString(params: Record<string, string | number | boolean | undefined>) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return query ? `?${query}` : "";
}
