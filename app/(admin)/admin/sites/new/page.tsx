"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createSiteSchema, CreateSiteInput } from "@/lib/validators";
import PageHeader from "@/components/shared/PageHeader";

export default function NewSitePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateSiteInput>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: { radius: 200, status: "ACTIVE" },
  });

  const onSubmit = async (data: CreateSiteInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Site created successfully!");
        router.push("/admin/sites");
      } else {
        toast.error(result.error ?? "Failed to create site");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        toast.success("Location captured");
      },
      () => toast.error("Location access denied")
    );
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Add Site"
        subtitle="Create a new construction site"
        icon={MapPin}
        breadcrumb={[
          { label: "Sites", href: "/admin/sites" },
          { label: "Add Site" },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
              Site Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Site Name <span className="text-danger-500">*</span>
                </label>
                <input
                  className={`input w-full ${errors.name ? "border-danger-400" : ""}`}
                  placeholder="e.g. Downtown Tower Block A"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Location <span className="text-danger-500">*</span>
                </label>
                <input
                  className={`input w-full ${errors.location ? "border-danger-400" : ""}`}
                  placeholder="City, District"
                  {...register("location")}
                />
                {errors.location && <p className="text-xs text-danger-500 mt-1">{errors.location.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Status
                </label>
                <select className="input w-full" {...register("status")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Full Address <span className="text-danger-500">*</span>
                </label>
                <textarea
                  rows={2}
                  className={`input w-full h-auto py-2 ${errors.address ? "border-danger-400" : ""}`}
                  placeholder="Full street address..."
                  {...register("address")}
                />
                {errors.address && <p className="text-xs text-danger-500 mt-1">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">GPS Location (Optional)</h3>
              <button
                type="button"
                onClick={getLocation}
                className="btn-secondary btn-sm text-xs"
              >
                <MapPin className="w-3 h-3" />
                Use My Location
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="input w-full"
                  placeholder="e.g. 13.0827"
                  {...register("latitude", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="input w-full"
                  placeholder="e.g. 80.2707"
                  {...register("longitude", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Geofence Radius (m)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="200"
                  {...register("radius", { valueAsNumber: true })}
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">
              GPS coordinates enable geofence verification during attendance marking.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="btn-primary btn-md">
              {isLoading ? "Creating..." : (
                <><MapPin className="w-4 h-4" />Create Site</>
              )}
            </button>
            <Link href="/admin/sites" className="btn-secondary btn-md">Cancel</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
