"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Upload, Shield } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import Avatar from "@/components/shared/Avatar";
import { changePasswordSchema, ChangePasswordInput } from "@/lib/validators";

export default function AdminProfilePage() {
  const { data: session } = useSession();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handlePasswordChange = async (data: ChangePasswordInput) => {
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Password changed successfully!");
        reset();
      } else {
        toast.error(result.error ?? "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  };

  const name = session?.user?.name ?? "Admin";

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your admin account"
        icon={User}
      />

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-5 pb-5 border-b border-border">
          <div className="relative">
            <Avatar name={name} image={session?.user?.image} size="xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{name}</h2>
            <p className="text-text-secondary text-sm">{session?.user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs bg-primary-50 text-primary px-2.5 py-0.5 rounded-full font-medium">
              <Shield className="w-3 h-3" />
              Administrator
            </span>
          </div>
        </div>

        <div className="pt-5 grid sm:grid-cols-2 gap-4">
          {[
            { icon: User, label: "Full Name", value: name },
            { icon: Mail, label: "Email Address", value: session?.user?.email },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-border">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Change Password</h2>
            <p className="text-xs text-text-secondary">Keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                className={`input w-full pr-10 ${errors.currentPassword ? "border-danger-400" : ""}`}
                placeholder="Enter current password"
                {...register("currentPassword")}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-xs text-danger-500 mt-1">{errors.currentPassword.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className={`input w-full pr-10 ${errors.newPassword ? "border-danger-400" : ""}`}
                  placeholder="Min. 8 characters"
                  {...register("newPassword")}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-danger-500 mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm Password</label>
              <input
                type="password"
                className={`input w-full ${errors.confirmPassword ? "border-danger-400" : ""}`}
                placeholder="Repeat new password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-xs text-danger-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={changingPassword} className="btn-primary btn-md">
            {changingPassword ? "Updating..." : (
              <><Lock className="w-4 h-4" />Update Password</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
