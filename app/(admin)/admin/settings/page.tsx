"use client";

import { motion } from "framer-motion";
import { Settings, Building2, Clock, MapPin, Bell, Database, Shield } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const settingGroups = [
  {
    title: "Company",
    icon: Building2,
    settings: [
      { label: "Company Name", description: "Your organization name", value: "AttendSP Construction" },
      { label: "Work Hours", description: "Standard work shift", value: "09:00 AM – 06:00 PM" },
      { label: "Late Threshold", description: "Minutes after start to be marked late", value: "30 minutes" },
    ],
  },
  {
    title: "Attendance",
    icon: Clock,
    settings: [
      { label: "Geofence Enforcement", description: "Require employees to be on-site", value: "Enabled" },
      { label: "Face Capture", description: "Require photo at check-in", value: "Enabled" },
      { label: "Auto-mark Absent", description: "Mark absent if no attendance by EOD", value: "Disabled" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    settings: [
      { label: "Leave Request Alerts", description: "Notify admin on new leave requests", value: "Enabled" },
      { label: "Late Arrival Alerts", description: "Alert on late check-ins", value: "Enabled" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Manage AttendSP configuration"
        icon={Settings}
      />

      <div className="card p-4 bg-info-50 border-info-200">
        <p className="text-sm text-info-700 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          Settings are currently view-only. Full configuration will be available in the next release.
        </p>
      </div>

      {settingGroups.map((group, i) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <group.icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">{group.title}</h2>
          </div>
          <div className="space-y-3">
            {group.settings.map((setting) => (
              <div key={setting.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{setting.label}</p>
                  <p className="text-xs text-text-muted">{setting.description}</p>
                </div>
                <span className="text-sm text-text-secondary bg-neutral-100 px-3 py-1 rounded-lg font-medium">
                  {setting.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
