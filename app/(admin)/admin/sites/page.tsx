"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MapPin, Users, Eye } from "lucide-react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/LoadingStates";

interface Site {
  id: string;
  name: string;
  location: string;
  address: string;
  status: string;
  radius: number;
  _count: { siteEmployees: number; attendances: number };
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      pageSize: "50",
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/sites?${params}`);
    const data = await res.json();
    if (data.success) {
      setSites(data.data);
      setTotal(data.total);
    }
    setLoading(false);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const statusColors: Record<string, string> = {
    ACTIVE: "border-l-success-500",
    INACTIVE: "border-l-neutral-300",
    COMPLETED: "border-l-info-500",
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Construction Sites"
        subtitle={`${total} site${total !== 1 ? "s" : ""} total`}
        icon={MapPin}
        actions={
          <Link href="/admin/sites/new" className="btn-primary btn-md">
            <Plus className="w-4 h-4" />
            Add Site
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : sites.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MapPin}
            title="No sites found"
            description="Add your first construction site to start managing attendance"
            action={
              <Link href="/admin/sites/new" className="btn-primary btn-md">
                <Plus className="w-4 h-4" /> Add Site
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sites.map((site, i) => (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card border-l-4 ${statusColors[site.status] ?? "border-l-neutral-200"} hover:shadow-card-hover transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <StatusBadge status={site.status} />
              </div>
              <h3 className="font-semibold text-text-primary text-base mb-1">{site.name}</h3>
              <p className="text-sm text-text-secondary mb-3">{site.location}</p>
              <p className="text-xs text-text-muted mb-4 line-clamp-2">{site.address}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Users className="w-4 h-4" />
                  <span>{site._count.siteEmployees} employees</span>
                </div>
                <Link
                  href={`/admin/sites/${site.id}`}
                  className="flex items-center gap-1.5 text-primary text-xs font-medium hover:text-primary-hover"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
