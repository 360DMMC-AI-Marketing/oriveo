import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, PhoneIncoming, PhoneCall, FileText, XCircle, Clock, Calendar, Info, CheckCheck, Trash2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { getSocket, type NotificationData } from "@/lib/socket";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  emergency: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Emergency" },
  high_severity: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", label: "High Severity" },
  inbound_received: { icon: PhoneIncoming, color: "text-blue-600", bg: "bg-blue-50", label: "Inbound Call" },
  inbound_completed: { icon: PhoneCall, color: "text-green-600", bg: "bg-green-50", label: "Call Completed" },
  report_ready: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50", label: "Report Ready" },
  call_failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Call Failed" },
  follow_up_needed: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Follow-up Needed" },
  appointment_reminder: { icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50", label: "Appointment" },
  system_alert: { icon: Info, color: "text-gray-600", bg: "bg-gray-50", label: "System Alert" },
};

const typeFilterOptions = [
  { value: "", label: "All Types" },
  { value: "emergency", label: "Emergency" },
  { value: "high_severity", label: "High Severity" },
  { value: "inbound_received", label: "Inbound Call" },
  { value: "inbound_completed", label: "Call Completed" },
  { value: "call_failed", label: "Call Failed" },
  { value: "follow_up_needed", label: "Follow Up" },
  { value: "report_ready", label: "Reports" },
  { value: "system_alert", label: "System" },
];

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [tab, setTab] = useState<"all" | "unread" | "emergency">("all");
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (append = false) => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (tab === "unread") params.set("read", "false");
      if (tab === "emergency") params.set("type", "emergency");
      if (append) params.set("offset", String(notifications.length));
      const { data } = await api.get(`/notifications?${params}`);
      if (append) {
        setNotifications((prev) => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      setUnreadCount(data.unread);
      setHasMore(data.notifications.length === (parseInt(data.limit) || 20));
    } catch {} finally {
      setLoading(false);
    }
  }, [typeFilter, tab, notifications.length]);

  useEffect(() => {
    setLoading(true);
    setNotifications([]);
    fetchNotifications();
  }, [typeFilter, tab]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on("notification:new", () => fetchNotifications());
    }
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotif = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const handleClick = (notif: NotificationData) => {
    if (!notif.read) markRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  const tabs = [
    { value: "all" as const, label: "All", count: null },
    { value: "unread" as const, label: "Unread", count: unreadCount },
    { value: "emergency" as const, label: "Emergency", count: null },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with alerts and activity</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              tab === t.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 text-xs font-bold px-1">
                {t.count}
              </span>
            )}
          </button>
        ))}

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="ml-auto rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {typeFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Bell className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium text-gray-600">No notifications</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.system_alert;
            const Icon = cfg.icon;
            return (
              <div
                key={notif._id}
                className={cn(
                  "flex items-start gap-4 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-gray-50",
                  !notif.read && "bg-blue-50/40 border-blue-100"
                )}
                onClick={() => handleClick(notif)}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0", cfg.bg)}>
                  <Icon className={cn("h-5 w-5", cfg.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("text-sm", !notif.read ? "font-semibold text-gray-900" : "text-gray-700")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={() => fetchNotifications(true)}
              className="w-full py-3 text-sm font-medium text-primary hover:text-primary-dark cursor-pointer"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
