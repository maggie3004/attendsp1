"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Users, ArrowLeft, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Avatar from "@/components/shared/Avatar";
import StatusBadge from "@/components/shared/StatusBadge";
import { PageLoader } from "@/components/shared/LoadingStates";

interface Site {
  id: string;
  name: string;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  status: string;
  _count: { siteEmployees: number; attendances: number };
  siteEmployees: Array<{
    employee: {
      id: string;
      designation: string;
      status: string;
      user: { name: string; email: string; image: string | null };
    };
  }>;
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/sites/${params.id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setSite(res.data); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Delete this site? All assignments will be removed.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${params.id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Site deleted");
        router.push("/admin/sites");
      } else {
        toast.error(result.error ?? "Delete failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!site) return <div className="card text-center py-12 text-text-secondary">Site not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/admin/sites" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to Sites
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/admin/sites/${params.id}/edit`} className="btn-secondary btn-sm">
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger btn-sm">
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Site Info */}
        <div className="card lg:col-span-1">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-1">{site.name}</h2>
          <p className="text-text-secondary text-sm mb-3">{site.location}</p>
          <StatusBadge status={site.status} className="mb-4" />

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Address</p>
              <p className="text-text-secondary">{site.address}</p>
            </div>
            {site.latitude && site.longitude && (
              <div>
                <p className="text-xs text-text-muted mb-0.5">GPS Coordinates</p>
                <p className="text-text-secondary font-mono text-xs">
                  {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-text-muted mb-0.5">Geofence Radius</p>
              <p className="text-text-secondary">{site.radius} meters</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{site._count.siteEmployees}</p>
              <p className="text-xs text-text-muted">Employees</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success-600">{site._count.attendances}</p>
              <p className="text-xs text-text-muted">Attendances</p>
            </div>
          </div>
        </div>

        {/* Employees at Site */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-text-secondary" />
            <h3 className="text-base font-semibold text-text-primary">
              Assigned Employees ({site.siteEmployees.length})
            </h3>
          </div>

          {site.siteEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No employees assigned to this site</p>
            </div>
          ) : (
            <div className="space-y-3">
              {site.siteEmployees.map(({ employee: emp }, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl"
                >
                  <Avatar name={emp.user.name} image={emp.user.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{emp.user.name}</p>
                    <p className="text-xs text-text-muted">{emp.designation}</p>
                  </div>
                  <StatusBadge status={emp.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
