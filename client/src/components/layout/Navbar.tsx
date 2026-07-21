import { useState } from "react";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import ClinicalAssistant from "@/components/ClinicalAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const [showClinical, setShowClinical] = useState(false);
  if (!user) return null;

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3" role="banner">
      <div>
        <p className="text-sm text-gray-500">{user.organization?.name || "Workspace"}</p>
        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowClinical(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-all"
        >
          <Stethoscope className="h-4 w-4" />
          Clinical Assistant
        </button>
        <NotificationsDropdown />
      </div>
      {showClinical && <ClinicalAssistant onClose={() => setShowClinical(false)} />}
    </header>
  );
}
