import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import ClinicalAssistant from "@/components/ClinicalAssistant";
import CommandPalette from "@/components/CommandPalette";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, Menu, ChevronRight, LogOut, UserCircle, Settings, Building2 } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  appointments: "Appointments",
  "voice-agent": "Call Center",
  "call-review": "Call Review",
  analytics: "Analytics",
  reports: "Reports",
  templates: "Templates",
  "command-center": "Command Center",
  "knowledge-base": "Knowledge Base",
  clinic: "Clinic",
  rooms: "Rooms",
  "audit-log": "Audit Log",
  notifications: "Notifications",
  "my-profile": "My Profile",
  "onboarding-guide": "Onboarding Guide",
  "clinic/users": "Team",
  "admin/availability": "Availability",
  "settings/calendar": "Calendar Settings",
};

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showClinical, setShowClinical] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setShowAvatar(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => {
    const path = "/" + pathParts.slice(0, i + 1).join("/");
    return { label: routeLabels[part] || part.charAt(0).toUpperCase() + part.slice(1), path };
  });

  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between border-b bg-white px-4 sm:px-6 py-3" role="banner">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-gray-900 truncate">{crumb.label}</span>
              ) : (
                <button onClick={() => navigate(crumb.path)} className="text-gray-400 hover:text-gray-600 transition-colors truncate">
                  {crumb.label}
                </button>
              )}
            </span>
          ))}
        </nav>

        <div className="sm:hidden">
          <p className="text-sm font-semibold text-gray-900 truncate">{routeLabels[pathParts[pathParts.length - 1]] || "Dashboard"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CommandPalette />

        <button
          onClick={() => setShowClinical(true)}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-all duration-150"
        >
          <Stethoscope className="h-4 w-4" />
          Clinical Assistant
        </button>

        <NotificationsDropdown />

        {/* Avatar dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setShowAvatar(!showAvatar)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold hover:ring-2 hover:ring-primary/30 transition-all duration-150"
          >
            {initials}
          </button>

          {showAvatar && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-white shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="p-1">
                <button onClick={() => { navigate("/my-profile"); setShowAvatar(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  <UserCircle className="h-4 w-4 text-gray-400" /> My Profile
                </button>
                <button onClick={() => { navigate("/clinic"); setShowAvatar(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  <Settings className="h-4 w-4 text-gray-400" /> Settings
                </button>
                <button onClick={() => { navigate("/clinic"); setShowAvatar(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  <Building2 className="h-4 w-4 text-gray-400" /> {user.organization?.name || "Clinic"}
                </button>
              </div>
              <div className="p-1 border-t">
                <button onClick={() => { logout(); setShowAvatar(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showClinical && <ClinicalAssistant onClose={() => setShowClinical(false)} />}
    </header>
  );
}
