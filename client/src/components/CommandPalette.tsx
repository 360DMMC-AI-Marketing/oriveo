import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, LayoutDashboard, Users, Phone, Calendar, BarChart3,
  FileText, ShieldCheck, Bot, Settings, BookOpen, Bell,
  Stethoscope, Building2, ClipboardList, Radio, UserCircle,
} from "lucide-react";

interface CommandItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  section: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  if (!user) return null;

  const allItems: CommandItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, action: () => navigate("/dashboard"), section: "Navigation" },
    { label: "Patients", icon: Users, action: () => navigate("/patients"), section: "Navigation" },
    { label: "Appointments", icon: Calendar, action: () => navigate("/appointments"), section: "Navigation" },
    { label: "Call Center", icon: Phone, action: () => navigate("/voice-agent"), section: "Navigation" },
    { label: "Call Review", icon: ShieldCheck, action: () => navigate("/call-review"), section: "Navigation" },
    { label: "Analytics", icon: BarChart3, action: () => navigate("/analytics"), section: "Navigation" },
    { label: "Reports", icon: FileText, action: () => navigate("/reports"), section: "Navigation" },
    { label: "Templates", icon: ClipboardList, action: () => navigate("/templates"), section: "Navigation" },
    { label: "Command Center", icon: Radio, action: () => navigate("/command-center"), section: "Navigation" },
    { label: "Knowledge Base", icon: BookOpen, action: () => navigate("/knowledge-base"), section: "Navigation" },
    ...(user.role === "admin" ? [
      { label: "Team Management", icon: Users, action: () => navigate("/clinic/users"), section: "Admin" },
      { label: "Room Management", icon: Building2, action: () => navigate("/rooms"), section: "Admin" },
      { label: "Audit Log", icon: ShieldCheck, action: () => navigate("/audit-log"), section: "Admin" },
      { label: "Clinic Settings", icon: Settings, action: () => navigate("/clinic"), section: "Admin" },
    ] : []),
    { label: "My Profile", icon: UserCircle, action: () => navigate("/my-profile"), section: "Account" },
    { label: "Notifications", icon: Bell, action: () => navigate("/notifications"), section: "Account" },
    { label: "Onboarding Guide", icon: BookOpen, action: () => navigate("/onboarding-guide"), section: "Account" },
  ];

  const filtered = query
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const sections = [...new Set(filtered.map((i) => i.section))];

  return (
    <>
      <button
        onClick={toggle}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 hidden sm:inline-flex items-center gap-0.5 rounded border bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-lg gap-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, actions..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">esc</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {sections.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No results found</div>
            ) : (
              sections.map((section) => (
                <div key={section}>
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{section}</div>
                  {filtered
                    .filter((i) => i.section === section)
                    .map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { item.action(); setOpen(false); setQuery(""); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <item.icon className="h-4 w-4 text-gray-400 shrink-0" />
                        {item.label}
                      </button>
                    ))}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
