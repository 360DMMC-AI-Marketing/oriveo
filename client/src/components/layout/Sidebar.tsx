import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Phone, Stethoscope,
  ClipboardList, BarChart3, ShieldCheck,
  ChevronDown, ChevronRight, Menu, Calendar, ScrollText,
  FileText, Radio, Building2, UserPlus,
  Dog, Smile, HeartPulse, X, Activity, Settings, ChevronLeft
} from "lucide-react";

const TYPE_ICONS: Record<string, any> = { human: HeartPulse, dental: Smile, veterinary: Dog };
const TYPE_LABELS: Record<string, string> = { human: "Oriveo", dental: "Oriveo Dental", veterinary: "Oriveo Vet" };

interface NavChild { to: string; icon: React.ElementType; label: string; roles: string[]; }
interface NavGroup { label: string; icon: React.ElementType; roles: string[]; children: NavChild[]; }

function getNavGroups(clinicType: string, isLarge: boolean): NavGroup[] {
  return [
    {
      label: "Overview", icon: LayoutDashboard, roles: ["admin", "doctor", "nurse", "receptionist"],
      children: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "doctor", "nurse", "receptionist"] },
        { to: "/command-center", icon: Radio, label: "Command Center", roles: ["admin", "doctor"] },
        { to: "/analytics", icon: BarChart3, label: "Analytics", roles: ["admin", "doctor"] },
        { to: "/reports", icon: FileText, label: "Reports", roles: ["admin", "doctor", "nurse", "receptionist"] },
      ],
    },
    {
      label: "Communications", icon: Phone, roles: ["admin", "doctor", "nurse"],
      children: [
        { to: "/voice-agent", icon: Phone, label: "Call Center", roles: ["admin", "doctor", "nurse"] },
        { to: "/call-review", icon: ShieldCheck, label: "Call Review", roles: ["admin", "doctor", "nurse"] },
      ],
    },
    {
      label: "Clinical", icon: Stethoscope, roles: ["admin", "doctor", "nurse", "receptionist"],
      children: [
        { to: "/patients", icon: Users, label: "Patients", roles: ["admin", "doctor", "nurse", "receptionist"] },
        { to: "/appointments", icon: Calendar, label: "Appointments", roles: ["admin", "doctor", "nurse", "receptionist"] },
        { to: "/templates", icon: ClipboardList, label: "Templates & Forms", roles: ["admin", "doctor", "nurse"] },
      ],
    },
    {
      label: "Organization", icon: Building2, roles: ["admin", "doctor", "nurse", "receptionist"],
      children: [
        { to: "/clinic", icon: Building2, label: "Clinic", roles: ["admin", "doctor", "nurse", "receptionist"] },
        { to: "/clinic/users", icon: UserPlus, label: "Team", roles: ["admin"] },
        ...(isLarge ? [{ to: "/rooms", icon: Building2, label: "Rooms", roles: ["admin", "doctor", "nurse", "receptionist"] as string[] }] : []),
        { to: "/audit-log", icon: ScrollText, label: "Audit Log", roles: ["admin"] },
      ],
    },
  ];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const clinicType = user?.organization?.clinicType || "human";
  const isLarge = user?.organization?.clinicSize === "large";
  const navGroups = getNavGroups(clinicType, isLarge);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      initial[group.label] = group.children.some((child) => location.pathname.startsWith(child.to));
    }
    return initial;
  });

  if (!user) return null;

  const toggleGroup = (label: string) => setExpandedGroups((p) => ({ ...p, [label]: !p[label] }));
  const filteredGroups = navGroups.filter((g) => g.roles.includes(user.role));
  const TypeIcon = TYPE_ICONS[clinicType] || HeartPulse;
  const typeLabel = TYPE_LABELS[clinicType] || "Oriveo";

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <TypeIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">{typeLabel}</h1>
            <p className="text-[10px] text-gray-500 leading-tight">Healthcare AI</p>
          </div>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-800 text-gray-500 lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredGroups.map((group) => {
          const visibleChildren = group.children.filter((child) => child.roles.includes(user.role));
          if (visibleChildren.length === 0) return null;
          const isExpanded = expandedGroups[group.label];
          const isGroupActive = visibleChildren.some((child) => location.pathname.startsWith(child.to));
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isExpanded}
                aria-label={`${group.label} section`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                  isGroupActive ? "text-white" : "text-gray-400 hover:text-gray-200"
                )}
              >
                <group.icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                )}
              </button>
              {isExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {visibleChildren.map((child) => {
                    const isActive = location.pathname.startsWith(child.to);
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => onClose()}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ml-5 border-l border-gray-800",
                          isActive
                            ? "bg-primary/10 text-primary border-l-primary"
                            : "text-gray-400 hover:text-gray-200 hover:border-gray-600"
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

    </>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-900 transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
