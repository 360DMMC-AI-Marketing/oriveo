import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Stethoscope, FileText, PenLine, Signature, Search, CheckCircle2, Clock, User, Syringe, Pill, Activity, Save } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function ClinicalTab({ patientId, specialty }: { patientId: string; specialty?: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    encounterDate: new Date().toISOString().slice(0, 16),
    encounterType: "office",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    diagnoses: [] as any[],
    medications: [] as any[],
    orders: [] as string[],
    vitals: {} as any,
    followUp: { recommended: false, timeframe: "", notes: "" },
  });
  const [icdQuery, setIcdQuery] = useState("");
  const [icdResults, setIcdResults] = useState<any[]>([]);
  const [searchingIcd, setSearchingIcd] = useState(false);
  const [newOrder, setNewOrder] = useState("");
  const [newMed, setNewMed] = useState({ name: "", dose: "", route: "oral", frequency: "", duration: "" });

  const { data } = useQuery({
    queryKey: ["clinical-notes", patientId, specialty],
    queryFn: () => api.get(`/clinical/patients/${patientId}/notes${specialty ? `?specialty=${specialty}` : ""}`).then((r) => r.data),
  });

  const { data: templatesData } = useQuery({
    queryKey: ["clinical-templates", specialty],
    queryFn: () => api.get(`/clinical/templates${specialty ? `?specialty=${specialty}` : ""}`).then((r) => r.data),
  });

  const notes = data?.notes || [];
  const templates = templatesData?.templates || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/clinical/patients/${patientId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-notes", patientId] });
      resetForm();
      toast.success("Clinical note saved");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: any }) =>
      api.put(`/clinical/patients/${patientId}/notes/${noteId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-notes", patientId] });
      resetForm();
      toast.success("Clinical note updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update"),
  });

  const signMutation = useMutation({
    mutationFn: ({ noteId, signatureTitle }: { noteId: string; signatureTitle?: string }) =>
      api.post(`/clinical/patients/${patientId}/notes/${noteId}/sign`, { signatureTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-notes", patientId] });
      toast.success("Note signed");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to sign"),
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => api.delete(`/clinical/patients/${patientId}/notes/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-notes", patientId] });
      toast.success("Note deleted");
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingNoteId(null);
    setForm({
      encounterDate: new Date().toISOString().slice(0, 16),
      encounterType: "office",
      subjective: "", objective: "", assessment: "", plan: "",
      diagnoses: [], medications: [], orders: [],
      vitals: {},
      followUp: { recommended: false, timeframe: "", notes: "" },
    });
    setIcdQuery("");
    setIcdResults([]);
    setNewOrder("");
    setNewMed({ name: "", dose: "", route: "oral", frequency: "", duration: "" });
  }

  function editNote(note: any) {
    setEditingNoteId(note._id);
    setForm({
      encounterDate: note.encounterDate ? new Date(note.encounterDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      encounterType: note.encounterType || "office",
      subjective: note.subjective || "",
      objective: note.objective || "",
      assessment: note.assessment || "",
      plan: note.plan || "",
      diagnoses: note.diagnoses || [],
      medications: note.medications || [],
      orders: note.orders || [],
      vitals: note.vitals || {},
      followUp: note.followUp || { recommended: false, timeframe: "", notes: "" },
    });
    setShowForm(true);
  }

  function applyTemplate(template: any) {
    setForm((prev: any) => ({
      ...prev,
      subjective: template.subjectivePrompt || prev.subjective,
      objective: template.objectivePrompt || prev.objective,
      assessment: template.assessmentPrompt || prev.assessment,
      plan: template.planPrompt || prev.plan,
    }));
    toast.success(`Template "${template.name}" applied`);
  }

  function addDiagnosis(code: any) {
    if (form.diagnoses.some((d: any) => d.code === code.code)) return;
    setForm({
      ...form,
      diagnoses: [...form.diagnoses, { code: code.code, name: code.name, laterality: "unspecified" }],
    });
    setIcdQuery("");
    setIcdResults([]);
  }

  function removeDiagnosis(idx: number) {
    setForm({ ...form, diagnoses: form.diagnoses.filter((_: any, i: number) => i !== idx) });
  }

  function addMedication() {
    if (!newMed.name) return;
    setForm({ ...form, medications: [...form.medications, { ...newMed }] });
    setNewMed({ name: "", dose: "", route: "oral", frequency: "", duration: "" });
  }

  function removeMedication(idx: number) {
    setForm({ ...form, medications: form.medications.filter((_: any, i: number) => i !== idx) });
  }

  function addOrder() {
    if (!newOrder) return;
    setForm({ ...form, orders: [...form.orders, newOrder] });
    setNewOrder("");
  }

  function removeOrder(idx: number) {
    setForm({ ...form, orders: form.orders.filter((_: any, i: number) => i !== idx) });
  }

  const searchIcd = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setIcdResults([]); return; }
    setSearchingIcd(true);
    try {
      const res = await api.get(`/clinical/icd10?q=${encodeURIComponent(q)}`);
      setIcdResults(res.data.codes || []);
    } catch { setIcdResults([]); }
    finally { setSearchingIcd(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchIcd(icdQuery), 300);
    return () => clearTimeout(timer);
  }, [icdQuery, searchIcd]);

  function handleSave() {
    const payload = {
      ...form,
      encounterDate: new Date(form.encounterDate),
      specialty: specialty || "general",
    };
    if (editingNoteId) {
      updateMutation.mutate({ noteId: editingNoteId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{notes.length} clinical note(s)</p>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <PenLine className="h-4 w-4 mr-1" /> {showForm ? "Cancel" : "Write Note"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{editingNoteId ? "Edit" : "New"} Clinical Note</span>
              <Badge variant="outline" className="text-xs">{form.encounterType}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Encounter Date</label>
                <Input type="datetime-local" value={form.encounterDate}
                  onChange={e => setForm({ ...form, encounterDate: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select value={form.encounterType}
                  onChange={e => setForm({ ...form, encounterType: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                  <option value="office">Office Visit</option>
                  <option value="telehealth">Telehealth</option>
                  <option value="phone">Phone Call</option>
                  <option value="home">Home Visit</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>

            {templates.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Template</label>
                <div className="flex flex-wrap gap-1">
                  {templates.map((t: any) => (
                    <button key={t._id} onClick={() => applyTemplate(t)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:border-primary hover:text-primary">
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium text-blue-700">S — Subjective</label>
                <Textarea value={form.subjective} onChange={e => setForm({ ...form, subjective: e.target.value })}
                  rows={3} placeholder="Patient's reported symptoms, history, complaints..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium text-green-700">O — Objective</label>
                <Textarea value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}
                  rows={3} placeholder="Vitals, exam findings, lab results..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium text-red-700">A — Assessment</label>
                <Textarea value={form.assessment} onChange={e => setForm({ ...form, assessment: e.target.value })}
                  rows={3} placeholder="Diagnosis, differential, clinical impression..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium text-purple-700">P — Plan</label>
                <Textarea value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
                  rows={3} placeholder="Treatment, medications, referrals, follow-up..." />
              </div>
            </div>

            <div className="border-t pt-3">
              <label className="text-xs text-gray-500 block mb-2 font-medium">Vitals</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <Input type="number" placeholder="BP Sys" value={form.vitals.bpSystolic || ""}
                  onChange={e => setForm({ ...form, vitals: { ...form.vitals, bpSystolic: e.target.value } })}
                  className="h-8 text-xs" />
                <Input type="number" placeholder="BP Dia" value={form.vitals.bpDiastolic || ""}
                  onChange={e => setForm({ ...form, vitals: { ...form.vitals, bpDiastolic: e.target.value } })}
                  className="h-8 text-xs" />
                <Input type="number" placeholder="HR" value={form.vitals.heartRate || ""}
                  onChange={e => setForm({ ...form, vitals: { ...form.vitals, heartRate: e.target.value } })}
                  className="h-8 text-xs" />
                <Input type="number" step="0.1" placeholder="Temp" value={form.vitals.temperature || ""}
                  onChange={e => setForm({ ...form, vitals: { ...form.vitals, temperature: e.target.value } })}
                  className="h-8 text-xs" />
                <Input type="number" step="0.1" placeholder="Weight" value={form.vitals.weight || ""}
                  onChange={e => setForm({ ...form, vitals: { ...form.vitals, weight: e.target.value } })}
                  className="h-8 text-xs" />
                <Input type="number" placeholder="SpO2" value={form.vitals.spo2 || ""}
                  onChange={e => setForm({ ...form, vitals: { ...form.vitals, spo2: e.target.value } })}
                  className="h-8 text-xs" />
              </div>
            </div>

            <div className="border-t pt-3">
              <label className="text-xs text-gray-500 block mb-1 font-medium">Diagnoses (ICD-10)</label>
              <div className="relative">
                <Input value={icdQuery} onChange={e => setIcdQuery(e.target.value)}
                  placeholder="Search ICD-10 codes..." className="h-9 text-sm pl-8" />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {icdResults.length > 0 && (
                <div className="mt-1 border rounded-lg max-h-40 overflow-y-auto">
                  {icdResults.map((c: any) => (
                    <button key={c.code} onClick={() => addDiagnosis(c)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 border-b last:border-0 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{c.code}</Badge>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.diagnoses.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {form.diagnoses.map((d: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px] flex items-center gap-1">
                      {d.code} — {d.name}
                      <button onClick={() => removeDiagnosis(i)} className="ml-1 hover:text-red-500">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <label className="text-xs text-gray-500 block mb-1 font-medium">Medications</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                <Input value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                  placeholder="Medication" className="h-8 text-xs" />
                <Input value={newMed.dose} onChange={e => setNewMed({ ...newMed, dose: e.target.value })}
                  placeholder="Dose" className="h-8 text-xs" />
                <select value={newMed.route} onChange={e => setNewMed({ ...newMed, route: e.target.value })}
                  className="h-8 text-xs rounded-lg border border-gray-300 bg-white px-2">
                  <option value="oral">Oral</option>
                  <option value="topical">Topical</option>
                  <option value="iv">IV</option>
                  <option value="im">IM</option>
                  <option value="sublingual">Sublingual</option>
                  <option value="inhaled">Inhaled</option>
                </select>
                <Input value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                  placeholder="Frequency" className="h-8 text-xs" />
                <Button size="sm" variant="outline" onClick={addMedication} disabled={!newMed.name}
                  className="h-8 text-xs">Add</Button>
              </div>
              {form.medications.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 border-b last:border-0">
                  <Pill className="h-3 w-3 text-purple-500" />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-gray-500">{m.dose}</span>
                  <span className="text-gray-400">{m.route}</span>
                  <span className="text-gray-500">{m.frequency}</span>
                  <button onClick={() => removeMedication(i)} className="ml-auto text-gray-400 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-3">
              <label className="text-xs text-gray-500 block mb-1 font-medium">Orders</label>
              <div className="flex gap-2 mb-2">
                <Input value={newOrder} onChange={e => setNewOrder(e.target.value)}
                  placeholder="e.g., CBC, Chest X-ray, EKG..." className="h-8 text-sm flex-1" />
                <Button size="sm" variant="outline" onClick={addOrder} disabled={!newOrder}
                  className="h-8 text-xs">Add</Button>
              </div>
              {form.orders.map((o: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 border-b last:border-0">
                  <Activity className="h-3 w-3 text-blue-500" />
                  <span>{o}</span>
                  <button onClick={() => removeOrder(i)} className="ml-auto text-gray-400 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-3">
              <label className="flex items-center gap-2 text-xs font-medium mb-2">
                <input type="checkbox" checked={form.followUp.recommended}
                  onChange={e => setForm({ ...form, followUp: { ...form.followUp, recommended: e.target.checked } })}
                  className="rounded" />
                Recommend Follow-up
              </label>
              {form.followUp.recommended && (
                <div className="grid grid-cols-2 gap-3">
                  <Input value={form.followUp.timeframe}
                    onChange={e => setForm({ ...form, followUp: { ...form.followUp, timeframe: e.target.value } })}
                    placeholder="e.g., 2 weeks, 1 month" className="h-8 text-sm" />
                  <Input value={form.followUp.notes}
                    onChange={e => setForm({ ...form, followUp: { ...form.followUp, notes: e.target.value } })}
                    placeholder="Follow-up notes" className="h-8 text-sm" />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="gap-1">
                <Save className="h-4 w-4" />
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingNoteId ? "Update Note" : "Save Note"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !showForm ? (
        <p className="text-sm text-gray-500 text-center py-8">No clinical notes yet</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note: any) => (
            <Card key={note._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {note.isSigned ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium">
                      {formatDateTime(note.encounterDate)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{note.encounterType}</Badge>
                    {note.isSigned ? (
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                        <Signature className="h-2.5 w-2.5" /> Signed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-600">Pending</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!note.isSigned && (
                      <button onClick={() => editNote(note)} className="text-xs text-primary hover:underline">Edit</button>
                    )}
                    {!note.isSigned && (
                      <button onClick={() => {
                        const title = prompt("Signature title (e.g., MD, DDS, DVM):", "MD");
                        if (title !== null) signMutation.mutate({ noteId: note._id, signatureTitle: title });
                      }} className="text-xs text-green-600 hover:underline ml-2">Sign</button>
                    )}
                    <button onClick={() => { if (confirm("Delete this note?")) deleteMutation.mutate(note._id); }}
                      className="text-xs text-red-500 hover:underline ml-2">Delete</button>
                  </div>
                </div>

                {note.diagnoses?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {note.diagnoses.map((d: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{d.code} — {d.name}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {note.subjective && (
                    <div className="bg-blue-50 rounded p-2">
                      <span className="font-medium text-blue-700">S:</span> {note.subjective.slice(0, 150)}{note.subjective.length > 150 && "..."}
                    </div>
                  )}
                  {note.objective && (
                    <div className="bg-green-50 rounded p-2">
                      <span className="font-medium text-green-700">O:</span> {note.objective.slice(0, 150)}{note.objective.length > 150 && "..."}
                    </div>
                  )}
                  {note.assessment && (
                    <div className="bg-red-50 rounded p-2">
                      <span className="font-medium text-red-700">A:</span> {note.assessment.slice(0, 150)}{note.assessment.length > 150 && "..."}
                    </div>
                  )}
                  {note.plan && (
                    <div className="bg-purple-50 rounded p-2">
                      <span className="font-medium text-purple-700">P:</span> {note.plan.slice(0, 150)}{note.plan.length > 150 && "..."}
                    </div>
                  )}
                </div>

                {note.signedBy?.name && (
                  <p className="text-xs text-gray-500 mt-2">
                    Signed by {note.signedBy.name}
                    {note.signatureTitle ? `, ${note.signatureTitle}` : ""}
                    {note.signedAt ? ` on ${formatDateTime(note.signedAt)}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
