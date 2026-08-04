import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { getSocket, type NotificationData } from "@/lib/socket";
import { typeConfig, timeAgo } from "@/lib/notifications";

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
        <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No new notifications</div>
            ) : (
              notifications.map((notif) => {
                const cfg = typeConfig[notif.type] || typeConfig.system_alert;
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer",
                      !notif.read && "bg-teal-50/40"
                    )}
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
                      <Icon className={cn("h-4 w-4", cfg.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-gray-900">{notif.title}</p>
                        {!notif.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{notif.message}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</p>
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
