import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, X, Heart, Weight, Thermometer, Droplets, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function VitalsTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bpSystolic: "", bpDiastolic: "", heartRate: "", temperature: "", weight: "", spo2: "", notes: "" });

  const { data } = useQuery({
    queryKey: ["patient-vitals", patientId],
    queryFn: () => api.get(`/patients/${patientId}/vitals`).then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post(`/patients/${patientId}/vitals`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-vitals", patientId] });
      setShowForm(false);
      setForm({ bpSystolic: "", bpDiastolic: "", heartRate: "", temperature: "", weight: "", spo2: "", notes: "" });
      toast.success("Vitals recorded");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
  });

  const vitals = data?.vitals || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{vitals.length} measurement(s)</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> {showForm ? "Cancel" : "Add Vitals"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1"><Heart className="h-3 w-3 text-red-500" /> BP Systolic</label>
                <Input type="number" value={form.bpSystolic} onChange={(e) => setForm({ ...form, bpSystolic: e.target.value })} placeholder="120" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1"><Heart className="h-3 w-3 text-red-500" /> BP Diastolic</label>
                <Input type="number" value={form.bpDiastolic} onChange={(e) => setForm({ ...form, bpDiastolic: e.target.value })} placeholder="80" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1"><Activity className="h-3 w-3 text-purple-500" /> Heart Rate</label>
                <Input type="number" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} placeholder="72 bpm" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1"><Thermometer className="h-3 w-3 text-orange-500" /> Temperature</label>
                <Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} placeholder="36.6 °C" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1"><Weight className="h-3 w-3 text-green-500" /> Weight</label>
                <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="70 kg" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" /> SpO2</label>
                <Input type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} placeholder="98 %" className="h-9 text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500 block mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="flex min-h-[50px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </div>
            <Button size="sm" className="mt-3" onClick={() => addMutation.mutate({
              bpSystolic: form.bpSystolic ? Number(form.bpSystolic) : null,
              bpDiastolic: form.bpDiastolic ? Number(form.bpDiastolic) : null,
              heartRate: form.heartRate ? Number(form.heartRate) : null,
              temperature: form.temperature ? Number(form.temperature) : null,
              weight: form.weight ? Number(form.weight) : null,
              spo2: form.spo2 ? Number(form.spo2) : null,
              notes: form.notes,
            })} disabled={addMutation.isPending}>
              Save Vitals
            </Button>
          </CardContent>
        </Card>
      )}

      {vitals.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No vitals recorded yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">BP</th>
                <th className="pb-2 font-medium">HR</th>
                <th className="pb-2 font-medium">Temp</th>
                <th className="pb-2 font-medium">Weight</th>
                <th className="pb-2 font-medium">SpO2</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {vitals.map((v: any) => (
                <tr key={v._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-500 text-xs">{formatDateTime(v.recordedAt)}</td>
                  <td className="py-2 pr-4 font-medium">{v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}` : "—"}</td>
                  <td className="py-2 pr-4">{v.heartRate ? `${v.heartRate}` : "—"}</td>
                  <td className="py-2 pr-4">{v.temperature ? `${v.temperature}°C` : "—"}</td>
                  <td className="py-2 pr-4">{v.weight ? `${v.weight} kg` : "—"}</td>
                  <td className="py-2 pr-4">{v.spo2 ? `${v.spo2}%` : "—"}</td>
                  <td className="py-2 text-xs text-gray-500 max-w-[120px] truncate">{v.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
