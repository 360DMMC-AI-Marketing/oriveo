import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Phone,
  Settings,
  LogOut,
  Stethoscope,
  UserPlus,
  ClipboardList,
  Bot,
  BarChart3,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Menu,
  Calendar,
  Clock,
  ScrollText,
  FileText,
  PhoneIncoming,
  Radio,
  Building2,
  CreditCard,
} from "lucide-react";

interface NavChild {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  roles: string[];
  children: NavChild[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["admin", "doctor", "nurse", "receptionist"],
    children: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "doctor", "nurse", "receptionist"] },
      { to: "/analytics", icon: BarChart3, label: "Analytics", roles: ["admin", "doctor"] },
      { to: "/reports", icon: FileText, label: "Medical Reports", roles: ["admin", "doctor"] },
    ],
  },
  {
    label: "Communications",
    icon: Phone,
    roles: ["admin", "doctor", "nurse"],
    children: [
      { to: "/voice-agent", icon: Phone, label: "Call Center", roles: ["admin", "doctor", "nurse"] },
      { to: "/live-monitoring", icon: Radio, label: "Live Monitoring", roles: ["admin", "doctor"] },
      { to: "/inbound-calls", icon: PhoneIncoming, label: "Inbound Calls", roles: ["admin", "doctor", "nurse"] },
      { to: "/call-review", icon: ShieldCheck, label: "Call Review", roles: ["admin", "doctor", "nurse"] },
    ],
  },
  {
    label: "Medical",
    icon: Stethoscope,
    roles: ["admin", "doctor", "nurse", "receptionist"],
    children: [
      { to: "/patients", icon: Users, label: "Patients & Groups", roles: ["admin", "doctor", "nurse", "receptionist"] },
      { to: "/appointments", icon: Calendar, label: "Appointments", roles: ["admin", "doctor", "nurse", "receptionist"] },
      { to: "/templates", icon: ClipboardList, label: "Templates", roles: ["admin", "doctor", "nurse"] },
    ],
  },
  {
    label: "Clinic",
    icon: Building2,
    roles: ["admin"],
    children: [
      { to: "/clinic", icon: Building2, label: "Dashboard", roles: ["admin", "doctor", "nurse", "receptionist"] },
      { to: "/clinic/settings", icon: Settings, label: "Settings", roles: ["admin"] },
      { to: "/clinic/users", icon: UserPlus, label: "Team", roles: ["admin"] },
      { to: "/audit-log", icon: ScrollText, label: "Audit Log", roles: ["admin"] },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      const isActive = group.children.some((child) => location.pathname.startsWith(child.to));
      initial[group.label] = isActive;
    }
    return initial;
  });

  if (!user) return null;

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const filteredGroups = navGroups.filter((g) => g.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
          O
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Oriveo</h1>
          <p className="text-xs text-gray-500">
            {user?.organization?.type === "veterinary" ? "Veterinary Voice AI" :
             user?.organization?.type === "dental" ? "Dental Voice AI" :
             "Medical Voice Assistant"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredGroups.map((group) => {
          const visibleChildren = group.children.filter((child) => child.roles.includes(user.role));
          if (visibleChildren.length === 0) return null;

          const isExpanded = expandedGroups[group.label];
          const isGroupActive = visibleChildren.some((child) => location.pathname.startsWith(child.to));

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  isGroupActive
                    ? "bg-primary-light text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <group.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                  {visibleChildren.map((child) => {
                    const isActive = location.pathname.startsWith(child.to);
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        )}
                      >
                        <child.icon className="h-4 w-4 flex-shrink-0" />
                        {child.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t px-4 py-4 space-y-1">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("opencode-show-tour"))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <BookOpen className="h-5 w-5" />
          Onboarding Guide
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
