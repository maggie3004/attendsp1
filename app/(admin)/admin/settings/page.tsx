"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings, Building2, Clock, Bell, Save, Loader2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SystemSettings {
  companyName: string;
  workStartTime: string;
  workEndTime: string;
  lateThresholdMins: number;
  geofenceEnabled: boolean;
  faceCaptureEnabled: boolean;
  autoMarkAbsent: boolean;
  leaveAlerts: boolean;
  lateAlerts: boolean;
}

const DEFAULTS: SystemSettings = {
  companyName: "AttendSP Construction",
  workStartTime: "09:00",
  workEndTime: "18:00",
  lateThresholdMins: 30,
  geofenceEnabled: true,
  faceCaptureEnabled: true,
  autoMarkAbsent: false,
  leaveAlerts: true,
  lateAlerts: true,
};

// ─── Toggle Switch Component ──────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        checked ? "bg-primary" : "bg-neutral-200"
      }`}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Text Input Row ────────────────────────────────────────────────────────────
function InputRow({
  label,
  description,
  type = "text",
  value,
  onChange,
  suffix,
  min,
  max,
}: {
  label: string;
  description: string;
  type?: string;
  value: string | number;
  onChange: (val: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="input text-sm text-right w-40"
        />
        {suffix && <span className="text-sm text-text-muted w-16">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Toggle Row ────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-medium ${checked ? "text-success-600" : "text-text-muted"}`}>
          {checked ? "Enabled" : "Disabled"}
        </span>
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Fetch current settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setSettings({ ...DEFAULTS, ...res.data });
        }
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback(<K extends keyof SystemSettings>(key: K, val: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          lateThresholdMins: Number(settings.lateThresholdMins),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Settings saved successfully");
        setDirty(false);
      } else {
        toast.error(data.error ?? "Failed to save settings");
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Configure AttendSP system behaviour"
        icon={Settings}
        actions={
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      {/* ── Company ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-2 pb-4 border-b border-border">
          <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Company</h2>
        </div>

        <div className="divide-y divide-border">
          <InputRow
            label="Company Name"
            description="Your organisation name shown throughout the app"
            value={settings.companyName}
            onChange={(v) => update("companyName", v)}
          />
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Work Hours</p>
              <p className="text-xs text-text-muted mt-0.5">Standard work shift start and end time</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="time"
                value={settings.workStartTime}
                onChange={(e) => update("workStartTime", e.target.value)}
                className="input text-sm w-32"
              />
              <span className="text-text-muted text-sm">–</span>
              <input
                type="time"
                value={settings.workEndTime}
                onChange={(e) => update("workEndTime", e.target.value)}
                className="input text-sm w-32"
              />
            </div>
          </div>
          <InputRow
            label="Late Threshold"
            description="Minutes after work start time to be marked late"
            type="number"
            value={settings.lateThresholdMins}
            onChange={(v) => update("lateThresholdMins", Number(v))}
            suffix="minutes"
            min={0}
            max={120}
          />
        </div>
      </motion.div>

      {/* ── Attendance ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-2 pb-4 border-b border-border">
          <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Attendance</h2>
        </div>

        <div className="divide-y divide-border">
          <ToggleRow
            label="Geofence Enforcement"
            description="Require employees to be within the site's GPS radius to check in"
            checked={settings.geofenceEnabled}
            onChange={(v) => update("geofenceEnabled", v)}
          />
          <ToggleRow
            label="Face Capture"
            description="Require a face photo at check-in for identity verification"
            checked={settings.faceCaptureEnabled}
            onChange={(v) => update("faceCaptureEnabled", v)}
          />
          <ToggleRow
            label="Auto-mark Absent"
            description="Automatically mark employees absent if no check-in by end of day"
            checked={settings.autoMarkAbsent}
            onChange={(v) => update("autoMarkAbsent", v)}
          />
        </div>
      </motion.div>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-2 pb-4 border-b border-border">
          <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Notifications</h2>
        </div>

        <div className="divide-y divide-border">
          <ToggleRow
            label="Leave Request Alerts"
            description="Send admin a notification whenever an employee submits a leave request"
            checked={settings.leaveAlerts}
            onChange={(v) => update("leaveAlerts", v)}
          />
          <ToggleRow
            label="Late Arrival Alerts"
            description="Notify admin when an employee checks in after the late threshold"
            checked={settings.lateAlerts}
            onChange={(v) => update("lateAlerts", v)}
          />
        </div>
      </motion.div>
    </div>
  );
}
