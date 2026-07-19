import {
  User,
  Employee,
  Site,
  Attendance,
  Leave,
  Notification,
  SiteEmployee,
  Role,
  EmployeeStatus,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  SiteStatus,
  NotificationType,
} from "@prisma/client";

// Re-export Prisma enums
export {
  Role,
  EmployeeStatus,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  SiteStatus,
  NotificationType,
};

// ---- Extended Types ----

export type EmployeeWithUser = Employee & {
  user: Pick<User, "id" | "name" | "email" | "image" | "role">;
  siteEmployees: (SiteEmployee & {
    site: Pick<Site, "id" | "name" | "location">;
  })[];
};

export type AttendanceWithEmployee = Attendance & {
  employee: Employee & {
    user: Pick<User, "name" | "image">;
  };
  site: Pick<Site, "id" | "name"> | null;
};

export type LeaveWithEmployee = Leave & {
  employee: Employee & {
    user: Pick<User, "name" | "image">;
  };
  approvedBy: Pick<User, "name"> | null;
};

export type SiteWithEmployees = Site & {
  siteEmployees: (SiteEmployee & {
    employee: Employee & {
      user: Pick<User, "name" | "image">;
    };
  })[];
  _count: {
    siteEmployees: number;
    attendances: number;
  };
};

export type NotificationWithUser = Notification;

// ---- API Response Types ----

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Dashboard Stats ----

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  activeSites: number;
  pendingLeaveRequests: number;
}

// ---- Filter Types ----

export interface AttendanceFilters {
  search?: string;
  status?: AttendanceStatus;
  siteId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface EmployeeFilters {
  search?: string;
  status?: EmployeeStatus;
  department?: string;
  siteId?: string;
  page?: number;
  pageSize?: number;
}

export interface LeaveFilters {
  search?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ---- NextAuth Session Extension ----

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: string;
      employeeId?: string;
      employeeCode?: string;
      designation?: string;
      department?: string;
    };
  }

  interface User {
    role?: string;
    employeeId?: string;
    employeeCode?: string;
    designation?: string;
    department?: string;
  }
}

import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    employeeId?: string;
    employeeCode?: string;
    designation?: string;
    department?: string;
  }
}
