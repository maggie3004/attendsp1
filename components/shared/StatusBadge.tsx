import { cn, getAttendanceStatusColor, getLeaveStatusColor } from "@/lib/utils";

type StatusType = "attendance" | "leave" | "employee" | "site";

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

const statusLabels: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TERMINATED: "Terminated",
  COMPLETED: "Completed",
  ANNUAL: "Annual",
  SICK: "Sick",
  EMERGENCY: "Emergency",
  UNPAID: "Unpaid",
  OTHER: "Other",
};

const statusColors: Record<string, string> = {
  PRESENT: "text-success-600 bg-success-50 border-success-200",
  ABSENT: "text-danger-600 bg-danger-50 border-danger-200",
  LATE: "text-warning-600 bg-warning-50 border-warning-200",
  HALF_DAY: "text-info-600 bg-info-50 border-info-200",
  PENDING: "text-info-600 bg-info-50 border-info-200",
  APPROVED: "text-success-600 bg-success-50 border-success-200",
  REJECTED: "text-danger-600 bg-danger-50 border-danger-200",
  CANCELLED: "text-neutral-600 bg-neutral-100 border-neutral-200",
  ACTIVE: "text-success-600 bg-success-50 border-success-200",
  INACTIVE: "text-warning-600 bg-warning-50 border-warning-200",
  TERMINATED: "text-danger-600 bg-danger-50 border-danger-200",
  COMPLETED: "text-neutral-600 bg-neutral-100 border-neutral-200",
};

const statusDots: Record<string, string> = {
  PRESENT: "bg-success-500",
  ABSENT: "bg-danger-500",
  LATE: "bg-warning-500",
  HALF_DAY: "bg-info-500",
  PENDING: "bg-info-500",
  APPROVED: "bg-success-500",
  REJECTED: "bg-danger-500",
  CANCELLED: "bg-neutral-400",
  ACTIVE: "bg-success-500",
  INACTIVE: "bg-warning-500",
  TERMINATED: "bg-danger-500",
  COMPLETED: "bg-neutral-400",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] ?? "text-neutral-600 bg-neutral-100 border-neutral-200";
  const dotClass = statusDots[status] ?? "bg-neutral-400";
  const label = statusLabels[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        colorClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  );
}
