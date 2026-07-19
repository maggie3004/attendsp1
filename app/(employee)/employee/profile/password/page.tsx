"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { changePasswordSchema, ChangePasswordInput } from "@/lib/validators";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Password changed successfully!");
        reset();
        router.back();
      } else {
        toast.error(result.error ?? "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary font-display">Change Password</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mobile-card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Update Password</p>
            <p className="text-xs text-text-secondary">Choose a strong password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { field: "currentPassword", label: "Current Password", show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
            { field: "newPassword", label: "New Password", show: showNew, toggle: () => setShowNew(!showNew) },
            { field: "confirmPassword", label: "Confirm New Password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
          ].map(({ field, label, show, toggle }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  className={`input w-full pr-10 ${errors[field as keyof ChangePasswordInput] ? "border-danger-400" : ""}`}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  {...register(field as keyof ChangePasswordInput)}
                />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors[field as keyof ChangePasswordInput] && (
                <p className="text-xs text-danger-500 mt-1">
                  {errors[field as keyof ChangePasswordInput]?.message}
                </p>
              )}
            </div>
          ))}

          <button type="submit" disabled={isLoading} className="mobile-btn-primary mt-2">
            {isLoading ? "Updating..." : (
              <><Lock className="w-5 h-5" />Change Password</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
