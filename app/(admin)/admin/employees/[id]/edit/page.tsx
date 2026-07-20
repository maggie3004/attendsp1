"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Save, Upload, Camera, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateEmployeeSchema, UpdateEmployeeInput } from "@/lib/validators";
import PageHeader from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingStates";
import { Users, MoreVertical, Image as ImageIcon } from "lucide-react";
import { getInitials } from "@/lib/utils";
import CameraCaptureModal from "@/components/shared/CameraCaptureModal";

interface Employee {
  id: string;
  designation: string;
  department: string;
  phone: string | null;
  address: string | null;
  status: string;
  user: { name: string; email: string; image: string | null };
  siteEmployees: Array<{ siteId: string; isActive: boolean }>;
}

interface Site {
  id: string;
  name: string;
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema),
  });

  useEffect(() => {
    fetch("/api/sites?pageSize=100")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSites(res.data);
      });

    fetch(`/api/employees/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const emp: Employee = res.data;
          setEmployeeName(emp.user.name);
          setProfileImage(emp.user.image ?? null);
          reset({
            name: emp.user.name,
            email: emp.user.email,
            designation: emp.designation,
            department: emp.department,
            phone: emp.phone ?? "",
            address: emp.address ?? "",
            status: emp.status as "ACTIVE" | "INACTIVE" | "TERMINATED",
            siteId: emp.siteEmployees.find((se) => se.isActive)?.siteId ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id, reset]);

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
          toast.success("Photo updated");
        } else {
          toast.error("Upload failed");
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (base64: string) => {
    setShowCamera(false);
    setUploadingImage(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, folder: "profiles" }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileImage(data.data.url);
        toast.success("Photo updated");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: UpdateEmployeeInput) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, profileImage }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Employee updated!");
        router.push(`/admin/employees/${params.id}`);
      } else {
        toast.error(result.error ?? "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Edit Employee"
        subtitle={employeeName || undefined}
        icon={Users}
        breadcrumb={[
          { label: "Employees", href: "/admin/employees" },
          ...(employeeName
            ? [{ label: employeeName, href: `/admin/employees/${params.id}` }]
            : []),
          { label: "Edit" },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-6"
      >
        {/* Profile Photo */}
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">Profile Photo</p>
          <div className="flex items-center gap-4">
            {/* Avatar preview */}
            <div className="relative w-20 h-20 shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-neutral-100 flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-text-muted">
                    {getInitials(employeeName)}
                  </span>
                )}
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="flex flex-col gap-2 relative">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOptions(!showOptions)}
                    className="btn-secondary btn-sm inline-flex items-center gap-2"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {uploadingImage ? "Uploading..." : "Change Photo"}
                  </button>

                  {showOptions && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-border shadow-modal rounded-xl overflow-hidden z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOptions(false);
                            setShowCamera(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-neutral-50 flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4 text-text-muted" />
                          Take Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowOptions(false);
                            fileInputRef.current?.click();
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-neutral-50 flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4 text-text-muted" />
                          Upload Photo
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {profileImage && (
                  <button
                    type="button"
                    onClick={() => setProfileImage(null)}
                    className="btn-ghost btn-sm text-danger-500 hover:text-danger-600 inline-flex items-center gap-2 px-2"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-text-muted">JPG, PNG or WEBP · Max 5MB</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </div>
        </div>

        {showCamera && (
          <CameraCaptureModal
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}

        <div className="h-px bg-border" />

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Full Name
              </label>
              <input
                className={`input w-full ${errors.name ? "border-danger-400" : ""}`}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-danger-500 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                type="email"
                className={`input w-full ${errors.email ? "border-danger-400" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Designation
              </label>
              <input
                className={`input w-full ${errors.designation ? "border-danger-400" : ""}`}
                {...register("designation")}
              />
              {errors.designation && (
                <p className="text-xs text-danger-500 mt-1">{errors.designation.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Department
              </label>
              <input
                className={`input w-full ${errors.department ? "border-danger-400" : ""}`}
                {...register("department")}
              />
              {errors.department && (
                <p className="text-xs text-danger-500 mt-1">{errors.department.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Phone
              </label>
              <input type="tel" className="input w-full" {...register("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Status
              </label>
              <select className="input w-full" {...register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Assign to Site
              </label>
              <select className="input w-full" {...register("siteId")}>
                <option value="">No site assigned</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Address
              </label>
              <textarea
                rows={2}
                className="input w-full h-auto py-2"
                {...register("address")}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary btn-md">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/admin/employees/${params.id}`}
              className="btn-secondary btn-md"
            >
              Cancel
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
