"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateEmployeeSchema, UpdateEmployeeInput } from "@/lib/validators";
import PageHeader from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingStates";
import { Users } from "lucide-react";

interface Employee {
  id: string;
  designation: string;
  department: string;
  phone: string | null;
  address: string | null;
  status: string;
  user: { name: string; email: string };
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema),
  });

  useEffect(() => {
    fetch(`/api/employees/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const emp: Employee = res.data;
          reset({
            name: emp.user.name,
            email: emp.user.email,
            designation: emp.designation,
            department: emp.department,
            phone: emp.phone ?? "",
            address: emp.address ?? "",
            status: emp.status as "ACTIVE" | "INACTIVE" | "TERMINATED",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id, reset]);

  const onSubmit = async (data: UpdateEmployeeInput) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
        icon={Users}
        breadcrumb={[
          { label: "Employees", href: "/admin/employees" },
          { label: "Edit Employee" },
        ]}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name</label>
              <input className={`input w-full ${errors.name ? "border-danger-400" : ""}`} {...register("name")} />
              {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input type="email" className={`input w-full ${errors.email ? "border-danger-400" : ""}`} {...register("email")} />
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Designation</label>
              <input className={`input w-full ${errors.designation ? "border-danger-400" : ""}`} {...register("designation")} />
              {errors.designation && <p className="text-xs text-danger-500 mt-1">{errors.designation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Department</label>
              <input className={`input w-full ${errors.department ? "border-danger-400" : ""}`} {...register("department")} />
              {errors.department && <p className="text-xs text-danger-500 mt-1">{errors.department.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
              <input type="tel" className="input w-full" {...register("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Status</label>
              <select className="input w-full" {...register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Address</label>
              <textarea rows={2} className="input w-full h-auto py-2" {...register("address")} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary btn-md">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href={`/admin/employees/${params.id}`} className="btn-secondary btn-md">Cancel</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
