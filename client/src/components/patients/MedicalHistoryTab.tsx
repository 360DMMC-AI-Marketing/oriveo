import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Stethoscope, Syringe, Pill, Droplets, Beaker, Calendar, HeartPulse, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  diagnosis:  { icon: <Stethoscope className="h-4 w-4" />,  color: "text-blue-600 bg-blue-50 border-blue-200", label: "Diagnosis" },
  surgery:    { icon: <Syringe className="h-4 w-4" />,      color: "text-red-600 bg-red-50 border-red-200", label: "Surgery" },
  medication: { icon: <Pill className="h-4 w-4" />,         color: "text-purple-600 bg-purple-50 border-purple-200", label: "Medication" },
  allergy:    { icon: <Droplets className="h-4 w-4" />,     color: "text-amber-600 bg-amber-50 border-amber-200", label: "Allergy" },
  lab:        { icon: <Beaker className="h-4 w-4" />,       color: "text-cyan-600 bg-cyan-50 border-cyan-200", label: "Lab Result" },
  vaccine:    { icon: <HeartPulse className="h-4 w-4" />,   color: "text-green-600 bg-green-50 border-green-200", label: "Vaccine" },
  imaging:    { icon: <FileText className="h-4 w-4" />,     color: "text-indigo-600 bg-indigo-50 border-indigo-200", label: "Imaging" },
  note:       { icon: <FileText className="h-4 w-4" />,     color: "text-gray-600 bg-gray-50 border-gray-200", label: "Note" },
  other:      { icon: <FileText className="h-4 w-4" />,     color: "text-gray-600 bg-gray-50 border-gray-200", label: "Other" },
};

export default function MedicalHistoryTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "note", title: "", description: "", date: "", doctor: "" });

  const { data } = useQuery({
    queryKey: ["patient-records", patientId],
    queryFn: () => api.get(`/patients/${patientId}/unified`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/patients/${patientId}/records`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-records", patientId] });
      setShowForm(false);
      setForm({ type: "note", title: "", description: "", date: "", doctor: "" });
      toast.success("Record added");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add record"),
  });

  const deleteMutation = useMutation({
    mutationFn: (rid: string) => api.delete(`/patients/${patientId}/records/${rid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-records", patientId] });
      toast.success("Record deleted");
    },
  });

  const records = data?.records || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{records.length} record(s)</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> {showForm ? "Cancel" : "Add Record"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                  {Object.entries(typeConfig).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Root canal treatment" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Details about this record..." />
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} size="sm">
              {createMutation.isPending ? "Saving..." : "Save Record"}
            </Button>
          </CardContent>
        </Card>
      )}

      {records.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No medical records yet</p>
      ) : (
        <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
          {records.map((r: any) => {
            const cfg = typeConfig[r.type] || typeConfig.other;
            return (
              <div key={r._id} className="relative">
                <div className={`absolute -left-[25px] p-1 rounded-full border-2 bg-white ${cfg.color.split(" ").slice(-1)[0]}`}>
                  {cfg.icon}
                </div>
                <Card className="ml-2">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                        <span className="text-xs text-gray-500">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</span>
                      </div>
                      <button onClick={() => { if (confirm("Delete this record?")) deleteMutation.mutate(r._id); }}
                        className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-medium mt-1">{r.title}</p>
                    {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                    {r.doctor?.name && <p className="text-xs text-gray-500 mt-1">By {r.doctor.name}</p>}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
