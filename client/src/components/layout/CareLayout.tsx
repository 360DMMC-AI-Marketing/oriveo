import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, FlaskConical, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/care/home-care", label: "Home Care", icon: Home, roles: ["admin", "doctor", "nurse", "caregiver"] },
  { to: "/care/labs", label: "Lab Results", icon: FlaskConical, roles: ["admin", "doctor", "nurse"] },
  { to: "/care/prescriptions", label: "Prescriptions", icon: Pill, roles: ["admin", "doctor"] },
];

export default function CareLayout() {
  const { user } = useAuth();
  const tabs = TABS.filter((t) => user?.superAdmin || t.roles.includes(user?.role || ""));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Care</h1>
          <p className="text-sm text-gray-500 mt-1">Home care, lab results and prescriptions</p>
        </div>
      </div>
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                isActive ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
              )
            }
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
