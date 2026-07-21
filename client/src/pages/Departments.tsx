import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Building2, Loader2, Plus, X, Check, AlertCircle } from "lucide-react";

const ROLE_ICONS: Record<string, string> = {
  doctor: "🩺",
  nurse: "🏥",
  receptionist: "📋",
  admin: "⚙️",
  staff: "🔧",
};

const ROLE_LABELS: Record<string, string> = {
  doctor: "Doctors",
  nurse: "Nurses & Aides-Soignants",
  receptionist: "Receptionists",
  admin: "Administrators",
  staff: "Support Staff",
};

const DEPT_ICONS: Record<string, string> = {
  medical: "🩺",
  nursing: "🏥",
  admin: "📋",
  support: "🔧",
  lab: "🔬",
  imaging: "📡",
  "child-life": "🧸",
  "neuro-dx": "🧠",
  therapy: "💬",
  aesthetics: "✨",
  aides: "🤝",
  endoscopy: "🔦",
  "diabetes-ed": "🍎",
  infusion: "💉",
  "social-work": "🤗",
  dialysis: "🩸",
  "resp-therapy": "🫁",
  optometry: "👁️",
  audiology: "👂",
  hygiene: "🦷",
  assisting: "🪑",
  surgical: "🏨",
  "surgical-nursing": "🏨",
  anesthesia: "😷",
  "child-care": "🧒",
  tech: "🔧",
  surgery: "🏨",
  kennel: "🐾",
  grooming: "✂️",
  farriery: "🐴",
  barn: "🌾",
  "farm-svc": "🚜",
  clinical: "🩺",
  "orthodontic": "😁",
  lab: "🔬",
};

export default function Departments() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["org-departments"],
    queryFn: () => api.get("/clinic-config/departments").then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (depts: any[]) => api.put("/clinic-config/departments", { departments: depts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-departments"] });
      toast.success("Departments saved");
    },
    onError: () => toast.error("Failed to save departments"),
  });

  const departments: any[] = data?.departments || [];
  const available: any[] = data?.available || [];
  const activeIds = departments.filter((d) => d.isActive).map((d) => d.id);
  const inactiveIds = departments.filter((d) => !d.isActive).map((d) => d.id);

  const addDepartment = (dept: any) => {
    const exists = departments.find((d) => d.id === dept.id);
    if (exists) {
      saveMutation.mutate(departments.map((d) => d.id === dept.id ? { ...d, isActive: true } : d));
    } else {
      saveMutation.mutate([...departments, { ...dept, isActive: true }]);
    }
  };

  const removeDepartment = (id: string) => {
    saveMutation.mutate(departments.filter((d) => d.id !== id));
  };

  const toggleDepartment = (id: string) => {
    saveMutation.mutate(departments.map((d) => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const activeDepts = departments.filter((d) => d.isActive);
  const availableToAdd = available.filter((a) => !departments.find((d) => d.id === a.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your clinic's departments and staff assignments</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> {activeDepts.length} active</span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-gray-400" /> {inactiveIds.length} inactive</span>
        </div>
      </div>

      {/* Active Departments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Active Departments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDepts.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No departments configured yet.</p>
              <p className="text-xs mt-1">Add departments from the "Available" section below.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeDepts.map((dept: any) => (
                <div key={dept.id} className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a7c6f]/10 text-lg">
                    {DEPT_ICONS[dept.id] || "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800">{dept.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {(dept.roles || []).map((role: string) => (
                        <span key={role} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          {ROLE_ICONS[role] || "👤"} {ROLE_LABELS[role] || role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeDepartment(dept.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Departments */}
      {availableToAdd.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Available Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-4">Departments recommended for your specialty. Click to add.</p>
            <div className="grid gap-2">
              {availableToAdd.map((dept: any) => (
                <button key={dept.id} onClick={() => addDepartment(dept)}
                  className="flex items-center gap-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 text-left transition-all hover:border-[#0a7c6f]/30 hover:bg-[#0a7c6f]/5 group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-base group-hover:bg-[#0a7c6f]/10">
                    {DEPT_ICONS[dept.id] || "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{dept.label}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{dept.description}</p>
                    {(dept.roles || []).length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {(dept.roles || []).map((role: string) => (
                          <span key={role} className="text-[10px] text-gray-400">
                            {ROLE_ICONS[role] || ""} {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a7c6f]/0 text-[#0a7c6f] group-hover:bg-[#0a7c6f]/10 transition-colors">
                    <Plus className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive */}
      {inactiveIds.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Inactive Departments ({inactiveIds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {departments.filter((d) => !d.isActive).map((dept: any) => (
                <button key={dept.id} onClick={() => toggleDepartment(dept.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors">
                  {DEPT_ICONS[dept.id] || "📋"} {dept.label}
                  <Plus className="h-3 w-3 ml-0.5" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
