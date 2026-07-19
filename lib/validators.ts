import { z } from "zod";

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ---- Employee ----
export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().min(2, "Department is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  siteId: z.string().optional(),
  joinDate: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().min(2, "Department is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
});

// ---- Site ----
export const createSiteSchema = z.object({
  name: z.string().min(2, "Site name is required"),
  location: z.string().min(2, "Location is required"),
  address: z.string().min(5, "Address is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(50).max(5000).default(200),
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).default("ACTIVE"),
});

// ---- Leave ----
export const leaveRequestSchema = z.object({
  leaveType: z.enum(["ANNUAL", "SICK", "EMERGENCY", "UNPAID", "OTHER"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 characters)"),
});

export const leaveActionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionNote: z.string().optional(),
});

// ---- Attendance ----
export const markAttendanceSchema = z.object({
  siteId: z.string().optional(),
  checkInImage: z.string().optional(),
  checkInLat: z.number().optional(),
  checkInLng: z.number().optional(),
  notes: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY"]),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
});

// ---- Profile ----
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ---- Types inferred from schemas ----
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type LeaveActionInput = z.infer<typeof leaveActionSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
