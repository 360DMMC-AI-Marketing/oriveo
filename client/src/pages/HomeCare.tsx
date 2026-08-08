import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home, CalendarDays, UserRound, MapPin, Activity, ClipboardList,
  Loader2, Plus, X, CheckCircle2, PhoneCall, HeartPulse, Link2,
  Stethoscope, Pencil, Trash2, Clock, Users,
} from "lucide-react";

type Tab = "visits" | "plans";

const VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  "in-progress": { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

const PLAN_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paused: { label: "Paused", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; cls: string }> }) {
  const cfg = map[status] || map.scheduled;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>;
}

async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // clipboard rejected (e.g. transient activation expired) — fall back below
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ─── Schedule Visit Modal ───────────────────────────────
function VisitForm({ patients, caregivers, onSave, onClose }: { patients: any[]; caregivers: any[]; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ patient: "", caregiver: "", scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16) });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Schedule Home Visit</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label>Patient *</Label>
            <select value={form.patient} onChange={e => setForm({ ...form, patient: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Select patient</option>
              {patients.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Caregiver</Label>
            <select value={form.caregiver} onChange={e => setForm({ ...form, caregiver: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Unassigned —</option>
              {caregivers.map((c: any) => <option key={c._id} value={c._id}>{c.name} ({c.role})</option>)}
            </select>
          </div>
          <div>
            <Label>Date & Time *</Label>
            <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!form.patient || !form.scheduledAt} onClick={() => onSave(form)}>
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Check-out Modal (vitals + SOAP) ────────────────────
function CheckoutForm({ visit, onSave, onClose }: { visit: any; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState<any>({
    vitals: { ...(visit.vitals || {}), bloodPressure: visit.vitals?.bloodPressure || "", heartRate: visit.vitals?.heartRate ?? "", temperature: visit.vitals?.temperature ?? "", spo2: visit.vitals?.spo2 ?? "", weight: visit.vitals?.weight ?? "", painScore: visit.vitals?.painScore ?? "", notes: visit.vitals?.notes || "" },
    soap: { ...(visit.soap || {}) },
    notes: visit.notes || "",
  });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const setV = (k: string, v: any) => setForm((p: any) => ({ ...p, vitals: { ...p.vitals, [k]: v } }));
  const setS = (k: string, v: any) => setForm((p: any) => ({ ...p, soap: { ...p.soap, [k]: v } }));
  const num = (v: any) => (v === "" || v === null || v === undefined ? null : Number(v));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Complete Visit — {visit.patient?.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><HeartPulse size={14} /> Vitals</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><Label>Blood Pressure</Label><Input placeholder="120/80" value={form.vitals.bloodPressure} onChange={e => setV("bloodPressure", e.target.value)} className="mt-1" /></div>
              <div><Label>Heart Rate (bpm)</Label><Input type="number" value={form.vitals.heartRate} onChange={e => setV("heartRate", num(e.target.value))} className="mt-1" /></div>
              <div><Label>Temperature (°C)</Label><Input type="number" step="0.1" value={form.vitals.temperature} onChange={e => setV("temperature", num(e.target.value))} className="mt-1" /></div>
              <div><Label>SpO2 (%)</Label><Input type="number" value={form.vitals.spo2} onChange={e => setV("spo2", num(e.target.value))} className="mt-1" /></div>
              <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={form.vitals.weight} onChange={e => setV("weight", num(e.target.value))} className="mt-1" /></div>
              <div><Label>Pain Score (0-10)</Label><Input type="number" min={0} max={10} value={form.vitals.painScore} onChange={e => setV("painScore", num(e.target.value))} className="mt-1" /></div>
            </div>
            <div className="mt-3"><Label>Vitals Notes</Label><textarea rows={2} value={form.vitals.notes} onChange={e => setV("notes", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><Stethoscope size={14} /> SOAP Notes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Subjective</Label><textarea rows={2} value={form.soap.subjective || ""} onChange={e => setS("subjective", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
              <div><Label>Objective</Label><textarea rows={2} value={form.soap.objective || ""} onChange={e => setS("objective", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
              <div><Label>Assessment</Label><textarea rows={2} value={form.soap.assessment || ""} onChange={e => setS("assessment", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
              <div><Label>Plan</Label><textarea rows={2} value={form.soap.plan || ""} onChange={e => setS("plan", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
            </div>
          </div>
          <div><Label>Visit Notes</Label><textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onSave({ ...form, vitals: { ...form.vitals, heartRate: num(form.vitals.heartRate), temperature: num(form.vitals.temperature), spo2: num(form.vitals.spo2), weight: num(form.vitals.weight), painScore: num(form.vitals.painScore) } })}>
            Complete Visit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Care Plan Modal ────────────────────────────────────
function CarePlanForm({ patients, caregivers, onSave, onClose, initial }: { patients: any[]; caregivers: any[]; onSave: (d: any) => void; onClose: () => void; initial?: any }) {
  const [form, setForm] = useState<any>(initial || { patient: "", caregiver: "", title: "", description: "", tasks: [], medications: [] });
  const [task, setTask] = useState("");
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medFreq, setMedFreq] = useState("");
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const addTask = () => { if (!task.trim()) return; set("tasks", [...form.tasks, { title: task.trim(), frequency: "daily" }]); setTask(""); };
  const addMed = () => { if (!medName.trim()) return; set("medications", [...form.medications, { name: medName.trim(), dose: medDose, frequency: medFreq }]); setMedName(""); setMedDose(""); setMedFreq(""); };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{initial ? "Edit Care Plan" : "New Care Plan"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Patient *</Label><select value={form.patient} onChange={e => set("patient", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Select patient</option>{patients.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
            <div><Label>Caregiver</Label><select value={form.caregiver} onChange={e => set("caregiver", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">— Unassigned —</option>{caregivers.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          </div>
          <div><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Post-surgery recovery plan" className="mt-1" /></div>
          <div><Label>Description</Label><textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
          <div>
            <Label>Tasks</Label>
            <div className="flex gap-2 mt-1">
              <Input value={task} onChange={e => setTask(e.target.value)} placeholder="e.g. Change dressing" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }} />
              <Button type="button" variant="outline" onClick={addTask} className="shrink-0"><Plus size={14} /></Button>
            </div>
            <div className="mt-2 space-y-1.5">
              {form.tasks.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span>{t.title}</span>
                  <button onClick={() => set("tasks", form.tasks.filter((_: any, j: number) => j !== i))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Medications</Label>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mt-1">
              <Input value={medName} onChange={e => setMedName(e.target.value)} placeholder="Name" />
              <Input value={medDose} onChange={e => setMedDose(e.target.value)} placeholder="Dose" />
              <Input value={medFreq} onChange={e => setMedFreq(e.target.value)} placeholder="Frequency" />
              <Button type="button" variant="outline" onClick={addMed} className="shrink-0"><Plus size={14} /></Button>
            </div>
            <div className="mt-2 space-y-1.5">
              {form.medications.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span><span className="font-medium">{m.name}</span> {m.dose && `· ${m.dose}`} {m.frequency && `· ${m.frequency}`}</span>
                  <button onClick={() => set("medications", form.medications.filter((_: any, j: number) => j !== i))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!form.patient || !form.title.trim()} onClick={() => onSave(form)}>
            {initial ? "Save Changes" : "Create Plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function HomeCare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("visits");
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [checkoutVisit, setCheckoutVisit] = useState<any>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const isCaregiver = user?.role === "caregiver";
  const canManage = user?.role === "admin" || user?.role === "doctor" || user?.role === "nurse";

  const { data: visitData, isLoading: loadingVisits } = useQuery({
    queryKey: ["homecare", "visits", statusFilter],
    queryFn: () => api.get(`/homecare/visits${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => r.data),
  });
  const { data: planData, isLoading: loadingPlans } = useQuery({
    queryKey: ["homecare", "care-plans"],
    queryFn: () => api.get("/homecare/care-plans").then(r => r.data),
  });
  const { data: patientData } = useQuery({
    queryKey: ["homecare", "patients"],
    queryFn: () => api.get("/patients?limit=500").then(r => r.data),
  });
  const { data: staffData } = useQuery({
    queryKey: ["homecare", "staff"],
    queryFn: () => api.get("/rooms/staff").then(r => r.data),
  });

  const patients = patientData?.patients || [];
  const caregivers = (staffData?.users || []).filter((s: any) => ["caregiver", "nurse", "doctor"].includes(s.role));
  const visits = visitData?.visits || [];
  const carePlans = planData?.carePlans || [];

  const createVisit = useMutation({
    mutationFn: (d: any) => api.post("/homecare/visits", d),
    onSuccess: () => { toast.success("Visit scheduled"); queryClient.invalidateQueries({ queryKey: ["homecare", "visits"] }); setShowVisitForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to schedule"),
  });
  const checkIn = useMutation({
    mutationFn: ({ id }: any) => {
      const payload: any = {};
      if (navigator.geolocation) {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { payload.lat = pos.coords.latitude; payload.lng = pos.coords.longitude; resolve(api.post(`/homecare/visits/${id}/check-in`, payload)); },
            () => resolve(api.post(`/homecare/visits/${id}/check-in`, {})),
            { timeout: 5000 }
          );
        });
      }
      return api.post(`/homecare/visits/${id}/check-in`, {});
    },
    onSuccess: () => { toast.success("Checked in"); queryClient.invalidateQueries({ queryKey: ["homecare", "visits"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Check-in failed"),
  });
  const checkOut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.post(`/homecare/visits/${id}/check-out`, d),
    onSuccess: () => { toast.success("Visit completed — RPM/CCM codes marked billable"); queryClient.invalidateQueries({ queryKey: ["homecare", "visits"] }); setCheckoutVisit(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Check-out failed"),
  });
  const deleteVisit = useMutation({
    mutationFn: (id: string) => api.delete(`/homecare/visits/${id}`),
    onSuccess: () => { toast.success("Visit removed"); queryClient.invalidateQueries({ queryKey: ["homecare", "visits"] }); },
  });
  const createPlan = useMutation({
    mutationFn: (d: any) => api.post("/homecare/care-plans", d),
    onSuccess: () => { toast.success("Care plan created"); queryClient.invalidateQueries({ queryKey: ["homecare", "care-plans"] }); setShowPlanForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create plan"),
  });
  const updatePlan = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/homecare/care-plans/${id}`, d),
    onSuccess: () => { toast.success("Care plan updated"); queryClient.invalidateQueries({ queryKey: ["homecare", "care-plans"] }); setEditingPlan(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to update plan"),
  });
  const completeTask = useMutation({
    mutationFn: ({ id, taskId }: any) => api.post(`/homecare/care-plans/${id}/tasks/${taskId}/complete`),
    onSuccess: () => { toast.success("Task completed"); queryClient.invalidateQueries({ queryKey: ["homecare", "care-plans"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });
  const familyLink = useMutation({
    mutationFn: (patientId: string) => api.post("/homecare/family-link", { patientId }),
    onSuccess: async (r: any) => {
      const copied = await copyText(r.data.familyLink);
      if (r.data.emailed) toast.success("Family link sent by email");
      else if (copied) toast.info(r.data.message || "Family link copied to clipboard");
      else toast.error(r.data.message || "Copy failed — link: " + r.data.familyLink);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "visits", label: "Home Visits", icon: Home },
    { id: "plans", label: "Care Plans", icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Care</h1>
          <p className="text-sm text-gray-500 mt-1">Visits, care plans and remote patient monitoring</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {tab === "visits" && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowVisitForm(true)}><Plus size={14} className="mr-1" /> Schedule Visit</Button>}
            {tab === "plans" && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowPlanForm(true)}><Plus size={14} className="mr-1" /> New Care Plan</Button>}
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "visits" && (
        <>
          {canManage && (
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">All statuses</option>
                {Object.keys(VISIT_STATUS).map(k => <option key={k} value={k}>{VISIT_STATUS[k].label}</option>)}
              </select>
            </div>
          )}
          {loadingVisits ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
          ) : visits.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Home size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No home visits</h3>
              <p className="text-gray-500 mb-4">Schedule a visit to get started.</p>
              {canManage && <Button onClick={() => setShowVisitForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus size={14} className="mr-1" /> Schedule Visit</Button>}
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {visits.map((v: any) => (
                <Card key={v._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200"><UserRound className="h-5 w-5 text-emerald-600" /></div>
                        <div>
                          <p className="font-semibold text-gray-900">{v.patient?.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><CalendarDays size={12} /> {new Date(v.scheduledAt).toLocaleString()}</p>
                          {v.caregiver && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Users size={12} /> {v.caregiver.name}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={v.status} map={VISIT_STATUS} />
                        {v.billableCodes?.length > 0 && (
                          <div className="flex gap-1">
                            {v.billableCodes.map((c: string) => <span key={c} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">{c}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                    {v.geoCheckIn?.address && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><MapPin size={12} /> {v.geoCheckIn.address}</p>
                    )}
                    {(v.soap?.subjective || v.soap?.objective || v.soap?.assessment || v.soap?.plan) && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                        {v.soap.subjective && <div><span className="font-medium text-gray-700">S:</span> <span className="text-gray-600">{v.soap.subjective}</span></div>}
                        {v.soap.objective && <div><span className="font-medium text-gray-700">O:</span> <span className="text-gray-600">{v.soap.objective}</span></div>}
                        {v.soap.assessment && <div><span className="font-medium text-gray-700">A:</span> <span className="text-gray-600">{v.soap.assessment}</span></div>}
                        {v.soap.plan && <div><span className="font-medium text-gray-700">P:</span> <span className="text-gray-600">{v.soap.plan}</span></div>}
                      </div>
                    )}
                    {v.vitals && (v.vitals.bloodPressure || v.vitals.heartRate || v.vitals.spo2 || v.vitals.temperature) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {v.vitals.bloodPressure && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">BP {v.vitals.bloodPressure}</span>}
                        {v.vitals.heartRate && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">HR {v.vitals.heartRate}</span>}
                        {v.vitals.spo2 && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">SpO2 {v.vitals.spo2}%</span>}
                        {v.vitals.temperature && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">Temp {v.vitals.temperature}°C</span>}
                        {v.vitals.weight && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">{v.vitals.weight} kg</span>}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {v.status === "scheduled" && canManage && (
                        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => checkIn.mutate({ id: v._id })}><MapPin size={13} className="mr-1" /> Check In</Button>
                      )}
                      {v.status === "in-progress" && canManage && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCheckoutVisit(v)}><CheckCircle2 size={13} className="mr-1" /> Complete & Record Vitals</Button>
                      )}
                      {canManage && v.status !== "completed" && (
                        <Button size="sm" variant="outline" className="text-red-500" onClick={() => { if (confirm("Cancel this visit?")) deleteVisit.mutate(v._id); }}><X size={13} /></Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "plans" && (
        <>
          {loadingPlans ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
          ) : carePlans.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No care plans</h3>
              <p className="text-gray-500 mb-4">Create a care plan with tasks and medications for home patients.</p>
              {canManage && <Button onClick={() => setShowPlanForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus size={14} className="mr-1" /> New Care Plan</Button>}
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {carePlans.map((p: any) => (
                <Card key={p._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{p.title}</h3>
                          <StatusBadge status={p.status} map={PLAN_STATUS} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.patient?.name} · Caregiver: {p.caregiver?.name || "Unassigned"}{p.patient?.familyEmail ? ` · Family email: ${p.patient.familyEmail}` : ""}</p>
                        {p.description && <p className="text-sm text-gray-600 mt-2">{p.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {canManage && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => familyLink.mutate(p.patient?._id)}><Link2 size={13} className="mr-1" /> Family Link</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingPlan(p)}><Pencil size={13} /></Button>
                            <Button size="sm" variant="outline" className="text-red-500" onClick={() => { if (confirm("Delete this care plan?")) { api.delete(`/homecare/care-plans/${p._id}`).then(() => { toast.success("Plan deleted"); queryClient.invalidateQueries({ queryKey: ["homecare", "care-plans"] }); }); } }}><Trash2 size={13} /></Button>
                          </>
                        )}
                      </div>
                    </div>
                    {p.tasks?.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {p.tasks.map((t: any) => (
                          <div key={t._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <span className={t.completed ? "line-through text-gray-400" : "text-gray-700"}>{t.title} <span className="text-xs text-gray-400 capitalize">· {t.frequency}</span></span>
                            {t.completed ? (
                              <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>
                            ) : (
                              <button onClick={() => completeTask.mutate({ id: p._id, taskId: t._id })} className="text-xs text-emerald-600 hover:underline">Mark done</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {p.medications?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.medications.map((m: any, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs"><span className="font-medium">{m.name}</span> {m.dose && `· ${m.dose}`} {m.frequency && `· ${m.frequency}`}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {showVisitForm && <VisitForm patients={patients} caregivers={caregivers} onSave={(d) => createVisit.mutate(d)} onClose={() => setShowVisitForm(false)} />}
      {checkoutVisit && <CheckoutForm visit={checkoutVisit} onSave={(d) => checkOut.mutate({ id: checkoutVisit._id, ...d })} onClose={() => setCheckoutVisit(null)} />}
      {showPlanForm && <CarePlanForm patients={patients} caregivers={caregivers} onSave={(d) => createPlan.mutate(d)} onClose={() => setShowPlanForm(false)} />}
      {editingPlan && (
        <CarePlanForm
          patients={patients}
          caregivers={caregivers}
          initial={{ patient: editingPlan.patient?._id || "", caregiver: editingPlan.caregiver?._id || "", title: editingPlan.title, description: editingPlan.description, tasks: editingPlan.tasks, medications: editingPlan.medications }}
          onSave={(d) => updatePlan.mutate({ id: editingPlan._id, ...d })}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}
