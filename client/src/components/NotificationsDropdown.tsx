import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, PhoneIncoming, PhoneCall, FileText, XCircle, Clock, Calendar, Info, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { getSocket, type NotificationData } from "@/lib/socket";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  emergency: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  high_severity: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  inbound_received: { icon: PhoneIncoming, color: "text-blue-600", bg: "bg-blue-50" },
  inbound_completed: { icon: PhoneCall, color: "text-green-600", bg: "bg-green-50" },
  report_ready: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  call_failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  follow_up_needed: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  appointment_reminder: { icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
  system_alert: { icon: Info, color: "text-gray-600", bg: "bg-gray-50" },
  call_transferred: { icon: PhoneCall, color: "text-blue-600", bg: "bg-blue-50" },
  appointment_pending: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  appointment_confirmed: { icon: CheckCheck, color: "text-green-600", bg: "bg-green-50" },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      const { data } = await api.get("/notifications?read=false&limit=5");
      setNotifications(data.notifications);
      setUnreadCount(data.unread);
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const socket = getSocket();
    if (socket) {
      socket.on("notification:new", () => {
        fetchUnread();
      });
    }
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const handleClick = (notif: NotificationData) => {
    if (!notif.read) {
      api.put(`/notifications/${notif._id}/read`).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
    }
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-white shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">No new notifications</div>
            ) : (
              notifications.map((notif) => {
                const cfg = typeConfig[notif.type] || typeConfig.system_alert;
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="flex gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0", cfg.bg)}>
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t px-4 py-2.5">
            <button
              onClick={() => { navigate("/notifications"); setOpen(false); }}
              className="w-full text-center text-xs font-medium text-primary hover:text-primary-dark cursor-pointer"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
