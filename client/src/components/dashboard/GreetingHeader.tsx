import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Bell, Phone, Users, Brain } from "lucide-react";
import { typeConfig, timeAgo } from "@/lib/notifications";

interface GreetingHeaderProps {
  userName: string;
  userRole: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  admin: { bg: "bg-purple-100", text: "text-purple-700", label: "Admin" },
  doctor: { bg: "bg-blue-100", text: "text-blue-700", label: "Doctor" },
  nurse: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Nurse" },
  receptionist: { bg: "bg-orange-100", text: "text-orange-700", label: "Receptionist" },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 12) return "☀️";
  if (h < 17) return "🌤️";
  return "🌙";
}

export function GreetingHeader({ userName, userRole }: GreetingHeaderProps) {
  const firstName = userName?.split(" ")[0] || "there";
  const role = ROLE_COLORS[userRole] || ROLE_COLORS.receptionist;
  const notifRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifCount } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => api.get("/notifications/unread-count").then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications?limit=8").then((r) => r.data),
    enabled: showNotifications,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markNotifRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ["notif-count"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notif-count"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {getGreeting()}, {firstName} {getGreetingEmoji()}
          </h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${role.bg} ${role.text}`}
          >
            {role.label}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{today}</p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/voice-agent"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
        >
          <Phone className="h-3.5 w-3.5" />
          Schedule Call
        </Link>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
        >
          <Users className="h-3.5 w-3.5" />
          Patients
        </Link>
        <Link
          to="/call-review"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
        >
          <Brain className="h-3.5 w-3.5" />
          AI Review
        </Link>

        <div className="relative ml-2" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white transition-all hover:bg-gray-50 hover:shadow-sm"
          >
            <Bell className="h-4.5 w-4.5 text-gray-600" />
            {(notifCount?.count || 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {notifCount.count > 99 ? "99+" : notifCount.count}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifData?.notifications?.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No notifications
                  </div>
                )}
                {notifData?.notifications?.map((n: any) => {
                  const cfg = typeConfig[n.type] || typeConfig.system_alert;
                  const Icon = cfg.icon;
                  return (
                    <Link
                      key={n._id}
                      to={n.link || "#"}
                      onClick={() => {
                        if (!n.read) markNotifRead(n._id);
                        setShowNotifications(false);
                      }}
                      className={`flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        !n.read ? "bg-teal-50/40" : ""
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate ${!n.read ? "font-medium text-gray-900" : "text-gray-700"}`}>
                            {n.title}
                          </p>
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link
                to="/notifications"
                onClick={() => setShowNotifications(false)}
                className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-gray-50"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
