"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Briefcase, Building2,
  Edit2, Lock, LogOut, Upload, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { updateProfileSchema, UpdateProfileInput } from "@/lib/validators";
import Avatar from "@/components/shared/Avatar";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

interface EmployeeProfile {
  id: string;
  employeeCode: string;
  designation: string;
  department: string;
  phone: string | null;
  address: string | null;
  status: string;
  joinDate: string;
  faceImage: string | null;
  user: { name: string; email: string; image: string | null };
  siteEmployees: Array<{ site: { name: string; location: string } }>;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (!session?.user?.employeeId) return;
    fetch(`/api/employees/${session.user.employeeId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setProfile(res.data);
          reset({
            name: res.data.user.name,
            phone: res.data.phone ?? "",
            address: res.data.address ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [session, reset]);

  const onSave = async (data: UpdateProfileInput) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${session?.user?.employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          address: data.address,
          email: profile?.user.email,
          designation: profile?.designation,
          department: profile?.department,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Profile updated!");
        setEditing(false);
        setProfile((prev) => prev ? { ...prev, user: { ...prev.user, name: data.name }, phone: data.phone ?? null, address: data.address ?? null } : prev);
      } else {
        toast.error(result.error ?? "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="skeleton h-32 rounded-3xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={profile?.user.name ?? "User"} image={profile?.user.image} size="xl" className="ring-4 ring-white/30" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-display truncate">{profile?.user.name}</h1>
            <p className="text-primary-200 text-sm">{profile?.designation}</p>
            <div className="mt-1.5">
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-mono">
                {profile?.employeeCode}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs text-primary-200">Department</p>
            <p className="text-sm font-medium">{profile?.department}</p>
          </div>
          <div>
            <p className="text-xs text-primary-200">Joined</p>
            <p className="text-sm font-medium">{profile?.joinDate ? formatDate(profile.joinDate) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-primary-200">Site</p>
            <p className="text-sm font-medium">{profile?.siteEmployees[0]?.site.name ?? "Unassigned"}</p>
          </div>
          <div>
            <p className="text-xs text-primary-200">Status</p>
            <p className="text-sm font-medium">{profile?.status}</p>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile */}
      {editing ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mobile-card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Edit Profile</h2>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name</label>
              <input className="input w-full" {...register("name")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Phone Number</label>
              <input type="tel" className="input w-full" placeholder="+91 98765 43210" {...register("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Address</label>
              <textarea rows={2} className="input w-full h-auto py-2" placeholder="Your address" {...register("address")} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 mobile-btn-primary text-sm h-11">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 btn-secondary rounded-xl">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mobile-card space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-text-primary">Contact Info</h2>
            <button onClick={() => setEditing(true)} className="text-xs text-primary font-medium flex items-center gap-1">
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          {[
            { icon: Mail, label: "Email", value: profile?.user.email },
            { icon: Phone, label: "Phone", value: profile?.phone ?? "Not provided" },
            { icon: MapPin, label: "Address", value: profile?.address ?? "Not provided" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-neutral-500" />
              </div>
              <div>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm text-text-primary">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Settings Links */}
      <div className="mobile-card space-y-1">
        {[
          { icon: Lock, label: "Change Password", href: "/employee/profile/password" },
        ].map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between py-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-neutral-600" />
              </div>
              <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </Link>
        ))}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 py-3"
        >
          <div className="w-9 h-9 bg-danger-50 rounded-xl flex items-center justify-center">
            <LogOut className="w-4 h-4 text-danger-500" />
          </div>
          <span className="text-sm font-medium text-danger-500">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
