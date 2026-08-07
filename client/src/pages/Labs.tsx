import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import CameraCapture from "@/components/CameraCapture";
import {
  FlaskConical, Loader2, Plus, X, Search, Trash2, FileDown, Activity, Camera, Image as ImageIcon,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ordered: { label: "Ordered", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  collected: { label: "Collected", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  "in-progress": { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200" },
};

const TEST_STATUS: Record<string, { label: string; cls: string }> = {
  normal: { label: "Normal", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  high: { label: "High", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  low: { label: "Low", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  critical: { label: "Critical", cls: "text-red-700 bg-red-50 border-red-200" },
  pending: { label: "Pending", cls: "text-gray-500 bg-gray-50 border-gray-200" },
};

const COMMON_PANELS = ["General", "CBC", "CMP", "Lipid Panel", "HbA1c", "Thyroid Panel", "Urinalysis", "Coagulation", "Vitamins"];

function LabForm({ patients, onSave, onClose, initial, photo }: { patients: any[]; onSave: (d: any) => void; onClose: () => void; initial?: any; photo?: string | null }) {
  const [form, setForm] = useState<any>(initial || { patient: "", panel: "General", tests: [{ name: "", value: "", unit: "", referenceLow: "", referenceHigh: "" }], notes: "" });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const setTest = (i: number, k: string, v: any) => setForm((p: any) => ({ ...p, tests: p.tests.map((t: any, j: number) => (j === i ? { ...t, [k]: v } : t)) }));
  const addTest = () => set("tests", [...form.tests, { name: "", value: "", unit: "", referenceLow: "", referenceHigh: "" }]);
  const rmTest = (i: number) => set("tests", form.tests.filter((_: any, j: number) => j !== i));
  const ready = form.patient && form.tests.some((t: any) => t.name.trim());

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{initial ? "Review extracted lab result" : "Add Lab Result"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {photo && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <img src={photo} alt="scanned" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
              <div>
                <p className="text-sm font-medium text-gray-700">Scanned photo attached</p>
                <p className="text-xs text-gray-500">It will be saved with this lab result. Edit any fields below before saving.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Patient *</Label><select value={form.patient} onChange={e => set("patient", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Select patient</option>{patients.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
            <div><Label>Panel</Label>
              <select value={form.panel} onChange={e => set("panel", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                {COMMON_PANELS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tests</Label>
              <Button type="button" size="sm" variant="outline" onClick={addTest}><Plus size={13} className="mr-1" /> Add Test</Button>
            </div>
            <div className="space-y-3">
              {form.tests.map((t: any, i: number) => (
                <div key={i} className="grid grid-cols-6 gap-2 items-start bg-gray-50 rounded-lg p-3">
                  <div className="col-span-6 sm:col-span-2"><Input placeholder="Test name *" value={t.name} onChange={e => setTest(i, "name", e.target.value)} /></div>
                  <div className="col-span-2 sm:col-span-1"><Input placeholder="Value" value={t.value} onChange={e => setTest(i, "value", e.target.value)} /></div>
                  <div className="col-span-2 sm:col-span-1"><Input placeholder="Unit" value={t.unit} onChange={e => setTest(i, "unit", e.target.value)} /></div>
                  <div className="col-span-3 sm:col-span-1"><Input placeholder="Ref low" value={t.referenceLow} onChange={e => setTest(i, "referenceLow", e.target.value)} /></div>
                  <div className="col-span-2 sm:col-span-1 flex items-center gap-1">
                    <Input placeholder="Ref high" value={t.referenceHigh} onChange={e => setTest(i, "referenceHigh", e.target.value)} />
                    <button onClick={() => rmTest(i)} className="p-1.5 text-red-400 hover:text-red-600 shrink-0"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div><Label>Notes</Label><textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!ready} onClick={() => onSave(form)}>
            Save Result
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScanLabsModal({ patients, onClose }: { patients: any[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState("");
  const [stage, setStage] = useState<"pick" | "camera" | "loading" | "review">("pick");
  const [photo, setPhoto] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cleanup = () => {
    if (docId && patient) {
      api.delete(`/patients/${patient}/documents/${docId}`).catch(() => {});
    }
  };

  const onCapture = async (url: string) => {
    setPhoto(url);
    setStage("loading");
    setError("");
    try {
      const blob = await (await fetch(url)).blob();
      const form = new FormData();
      form.append("image", blob, "scan.jpg");
      form.append("patient", patient);
      const r = await api.post("/labs/scan", form, { headers: { "Content-Type": "multipart/form-data" } });
      setDocId(r.data.documentId);
      if (r.data.draft) {
        setDraft({ patient, ...r.data.draft });
        setStage("review");
      } else {
        setDraft({ patient, panel: "General", tests: [{ name: "", value: "", unit: "", referenceLow: "", referenceHigh: "" }], notes: "" });
        setError("Could not read the photo — please fill the details manually below.");
        setStage("review");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Scan failed. Try again.");
      setStage("camera");
    }
  };

  const save = (d: any) => {
    api.post("/labs", { ...d, attachments: docId ? [docId] : [] })
      .then(() => {
        toast.success("Lab result saved");
        queryClient.invalidateQueries({ queryKey: ["labs"] });
        queryClient.invalidateQueries({ queryKey: ["labs-stats"] });
        setDocId(null);
        onClose();
      })
      .catch((e: any) => toast.error(e.response?.data?.message || "Failed to save"));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { if (stage !== "camera") { cleanup(); onClose(); } }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          {stage === "pick" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Scan lab result</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <p className="text-sm text-gray-500">Choose the patient, then take a photo of the lab report. AI will read it and fill the form for you.</p>
              <div>
                <Label>Patient *</Label>
                <select value={patient} onChange={e => setPatient(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  <option value="">Select patient</option>
                  {patients.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!patient} onClick={() => setStage("camera")}>
                  <Camera size={14} className="mr-1" /> Open Camera
                </Button>
              </div>
            </>
          )}

          {stage === "camera" && (
            <>
              <CameraCapture onCapture={onCapture} onCancel={() => setStage("pick")} />
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </>
          )}

          {stage === "loading" && (
            <div className="py-16 text-center">
              <Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={36} />
              <p className="text-sm text-gray-600">Reading the photo with AI…</p>
            </div>
          )}

          {stage === "review" && (
            <>
              {error && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{error}</p>}
              <LabForm patients={patients} photo={photo} initial={draft} onSave={save}
                onClose={() => { cleanup(); onClose(); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Labs() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["labs", statusFilter],
    queryFn: () => api.get(`/labs${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => r.data),
  });
  const { data: stats } = useQuery({ queryKey: ["labs-stats"], queryFn: () => api.get("/labs/stats").then(r => r.data) });
  const { data: patientData } = useQuery({ queryKey: ["labs-patients"], queryFn: () => api.get("/patients?limit=500").then(r => r.data) });

  const patients = patientData?.patients || [];
  const results = (data?.results || []).filter((r: any) => !search || r.patient?.name?.toLowerCase().includes(search.toLowerCase()));

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/labs", d),
    onSuccess: () => { toast.success("Lab result saved"); queryClient.invalidateQueries({ queryKey: ["labs"] }); queryClient.invalidateQueries({ queryKey: ["labs-stats"] }); setShowForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to save"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/labs/${id}`),
    onSuccess: () => { toast.success("Lab result deleted"); queryClient.invalidateQueries({ queryKey: ["labs"] }); queryClient.invalidateQueries({ queryKey: ["labs-stats"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
          <p className="text-sm text-gray-500 mt-1">Structured lab panels with auto-detected abnormal values</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => setShowScan(true)}><Camera size={14} className="mr-1" /> Scan</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}><Plus size={14} className="mr-1" /> Add Result</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Results", value: stats?.total ?? 0, cls: "text-gray-900", bg: "bg-gray-50" },
          { label: "Completed", value: stats?.completed ?? 0, cls: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending", value: stats?.pending ?? 0, cls: "text-amber-600", bg: "bg-amber-50" },
          { label: "Abnormal", value: stats?.abnormal ?? 0, cls: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient..." className="pl-9" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {Object.keys(STATUS_MAP).map(k => <option key={k} value={k}>{STATUS_MAP[k].label}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : results.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <FlaskConical size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No lab results</h3>
          <p className="text-gray-500 mb-4">Add the first structured lab panel.</p>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus size={14} className="mr-1" /> Add Result</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {results.map((r: any) => (
            <Card key={r._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-emerald-600" /> {r.panel} — {r.patient?.name}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${(STATUS_MAP[r.status] || STATUS_MAP.ordered).cls}`}>{(STATUS_MAP[r.status] || STATUS_MAP.ordered).label}</span>
                </CardTitle>
                <div className="text-xs text-gray-400 flex items-center gap-3">
                  <span>{new Date(r.orderedAt).toLocaleDateString()}</span>
                  {r.orderedBy && <span>· {r.orderedBy.name}</span>}
                  {r.attachments?.length > 0 && <span className="inline-flex items-center gap-1 text-gray-500"><ImageIcon size={12} /> photo</span>}
                  <button onClick={() => api.get(`/labs/${r._id}/fhir`).then((res) => { navigator.clipboard?.writeText(JSON.stringify(res.data, null, 2)); toast.info("FHIR Bundle copied"); })} className="text-emerald-600 hover:underline inline-flex items-center gap-1"><FileDown size={12} /> FHIR</button>
                  <button onClick={() => { if (confirm("Delete this lab result?")) deleteMut.mutate(r._id); }} className="text-red-400 hover:text-red-600 inline-flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500 text-xs">
                        <th className="pb-2 font-medium">Test</th>
                        <th className="pb-2 font-medium">Value</th>
                        <th className="pb-2 font-medium">Reference</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.tests.map((t: any, i: number) => {
                        const st = TEST_STATUS[t.status] || TEST_STATUS.pending;
                        return (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 font-medium text-gray-800">{t.name}</td>
                            <td className="py-2 text-gray-700">{t.value} {t.unit}</td>
                            <td className="py-2 text-gray-400">{t.referenceLow && t.referenceHigh ? `${t.referenceLow}–${t.referenceHigh}` : (t.referenceLow || t.referenceHigh || "—")}</td>
                            <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>{st.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && <LabForm patients={patients} onSave={(d) => createMut.mutate(d)} onClose={() => setShowForm(false)} />}
      {showScan && <ScanLabsModal patients={patients} onClose={() => setShowScan(false)} />}
    </div>
  );
}
