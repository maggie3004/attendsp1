"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createEmployeeSchema, CreateEmployeeInput } from "@/lib/validators";
import PageHeader from "@/components/shared/PageHeader";

interface Site {
  id: string;
  name: string;
  location: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
  });

  useEffect(() => {
    fetch("/api/sites?pageSize=100")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSites(res.data);
      });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, folder: "profiles" }),
        });
        const data = await res.json();
        if (data.success) {
          setProfileImage(data.data.url);
          toast.success("Image uploaded");
        }
      } catch {
        toast.error("Image upload failed");
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: CreateEmployeeInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, profileImage }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success("Employee created successfully!");
        router.push("/admin/employees");
      } else {
        toast.error(result.error ?? "Failed to create employee");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Add Employee"
        subtitle="Create a new employee account"
        icon={UserPlus}
        breadcrumb={[
          { label: "Employees", href: "/admin/employees" },
          { label: "Add Employee" },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-6"
      >
        {/* Profile Image */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 overflow-hidden border-2 border-dashed border-border flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-6 h-6 text-neutral-400" />
            )}
          </div>
          <div>
            <label
              htmlFor="profile-upload"
              className="btn-secondary btn-sm cursor-pointer"
            >
              {uploadingImage ? "Uploading..." : "Upload Photo"}
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
            <p className="text-xs text-text-muted mt-1.5">JPG, PNG up to 5MB</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
              Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Full Name <span className="text-danger-500">*</span>
                </label>
                <input
                  className={`input w-full ${errors.name ? "border-danger-400" : ""}`}
                  placeholder="John Doe"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Email Address <span className="text-danger-500">*</span>
                </label>
                <input
                  type="email"
                  className={`input w-full ${errors.email ? "border-danger-400" : ""}`}
                  placeholder="employee@company.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input w-full"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Join Date
                </label>
                <input
                  type="date"
                  className="input w-full"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  {...register("joinDate")}
                />
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
              Job Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Designation <span className="text-danger-500">*</span>
                </label>
                <input
                  className={`input w-full ${errors.designation ? "border-danger-400" : ""}`}
                  placeholder="e.g. Site Engineer"
                  {...register("designation")}
                />
                {errors.designation && <p className="text-xs text-danger-500 mt-1">{errors.designation.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Department <span className="text-danger-500">*</span>
                </label>
                <input
                  className={`input w-full ${errors.department ? "border-danger-400" : ""}`}
                  placeholder="e.g. Civil Works"
                  {...register("department")}
                />
                {errors.department && <p className="text-xs text-danger-500 mt-1">{errors.department.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Assign to Site
                </label>
                <select className="input w-full" {...register("siteId")}>
                  <option value="">Select site (optional)</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
              Account Credentials
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Password <span className="text-danger-500">*</span>
                </label>
                <input
                  type="password"
                  className={`input w-full ${errors.password ? "border-danger-400" : ""}`}
                  placeholder="Min. 8 characters"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-danger-500 mt-1">{errors.password.message}</p>}
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">
              The employee will use their email and this password to log in.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="btn-primary btn-md">
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Employee
                </>
              )}
            </button>
            <Link href="/admin/employees" className="btn-secondary btn-md">
              Cancel
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
