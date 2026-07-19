"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Megaphone, ClipboardCheck, CalendarOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingStates";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
}

const typeIcons: Record<string, React.ElementType> = {
  ATTENDANCE: ClipboardCheck,
  LEAVE: CalendarOff,
  SYSTEM: Megaphone,
  ALERT: AlertCircle,
};

const typeColors: Record<string, string> = {
  ATTENDANCE: "bg-info-50 text-info-600",
  LEAVE: "bg-purple-50 text-purple-600",
  SYSTEM: "bg-primary-50 text-primary",
  ALERT: "bg-danger-50 text-danger-600",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notifications?pageSize=50");
    const data = await res.json();
    if (data.success) {
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
      setTotal(data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications/all", { method: "PUT" });
    toast.success("All notifications marked as read");
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PUT" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        icon={Bell}
        actions={
          unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary btn-md">
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )
        }
      />

      {loading ? (
        <TableSkeleton rows={8} cols={1} />
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up! Notifications will appear here."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = typeIcons[notif.type] ?? Bell;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.isRead && markRead(notif.id)}
                className={cn(
                  "card cursor-pointer transition-all duration-150 hover:shadow-card-hover",
                  !notif.isRead && "border-l-4 border-l-primary bg-primary-50/20"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[notif.type] ?? "bg-neutral-100 text-neutral-500"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-semibold", notif.isRead ? "text-text-secondary" : "text-text-primary")}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-text-muted mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
