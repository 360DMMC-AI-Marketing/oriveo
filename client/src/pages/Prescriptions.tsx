import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import CameraCapture from "@/components/CameraCapture";
import {
  Pill, Loader2, Plus, X, Search, Trash2, PenLine, RefreshCw, Printer, Camera, Image as ImageIcon,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  filled: { label: "Filled", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  expired: { label: "Expired", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200" },
  completed: { label: "Completed", cls: "bg-purple-50 text-purple-700 border-purple-200" },
};

const ROUTES = ["oral", "topical", "IV", "IM", "subcutaneous", "inhalation", "ophthalmic", "otic", "rectal", "sublingual"];

function RxForm({ patients, onSave, onClose, initial, photo }: { patients: any[]; onSave: (d: any) => void; onClose: () => void; initial?: any; photo?: string | null }) {
  const [form, setForm] = useState<any>(initial || { patient: "", medication: "", dosage: "", route: "", frequency: "", instructions: "", quantity: "", refills: 0 });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{initial ? "Review extracted prescription" : "Write Prescription"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {photo && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <img src={photo} alt="scanned" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
              <div>
                <p className="text-sm font-medium text-gray-700">Scanned photo attached</p>
                <p className="text-xs text-gray-500">It will be saved with this prescription. Edit any fields below before saving.</p>
              </div>
            </div>
          )}
          <div><Label>Patient *</Label><select value={form.patient} onChange={e => setForm({ ...form, patient: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Select patient</option>{patients.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
          <div><Label>Medication *</Label><Input value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} placeholder="e.g. Amoxicillin 500mg" className="mt-1" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Dosage</Label><Input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder="500mg" className="mt-1" /></div>
            <div><Label>Route</Label>
              <select value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">—</option>{ROUTES.map(r => <option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div><Label>Frequency</Label><Input value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} placeholder="3x daily" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="30" className="mt-1" /></div>
            <div><Label>Refills</Label><Input type="number" min={0} value={form.refills} onChange={e => setForm({ ...form, refills: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
            <div><Label>End Date</Label><Input type="date" value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Instructions</Label><textarea rows={2} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="Take with food..." className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!form.patient || !form.medication.trim()} onClick={() => onSave({ ...form, quantity: form.quantity ? Number(form.quantity) : null, endDate: form.endDate ? new Date(form.endDate) : null })}>
            Write Rx
          </Button>
        </div>
      </div>
    </div>
  );
}

function RxPrint({ rx }: { rx: any }) {
  const openPrint = () => {
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    w.document.write(`<html><head><title>Prescription</title><style>body{font-family:Georgia,serif;padding:40px;color:#111} h1{font-size:20px;border-bottom:2px solid #111;padding-bottom:8px} .rx{border:1px solid #ccc;padding:24px;margin-top:20px;border-radius:8px} .sig{margin-top:40px;border-top:1px solid #111;padding-top:8px} table{width:100%} td{padding:4px 0} .muted{color:#555}</style></head><body>
      <h1>Medical Prescription</h1>
      <div class="rx">
        <table><tr><td><b>Patient:</b> ${rx.patient?.name || ""}</td><td><b>Date:</b> ${new Date(rx.createdAt).toLocaleDateString()}</td></tr></table>
        <h2 style="margin-top:24px">${rx.medication}</h2>
        <table style="margin-top:12px">
          ${rx.dosage ? `<tr><td><b>Dosage</b></td><td>${rx.dosage}</td></tr>` : ""}
          ${rx.route ? `<tr><td><b>Route</b></td><td class="muted" style="text-transform:capitalize">${rx.route}</td></tr>` : ""}
          ${rx.frequency ? `<tr><td><b>Frequency</b></td><td>${rx.frequency}</td></tr>` : ""}
          ${rx.quantity ? `<tr><td><b>Quantity</b></td><td>${rx.quantity}</td></tr>` : ""}
          ${rx.refills ? `<tr><td><b>Refills</b></td><td>${rx.refills}</td></tr>` : ""}
          ${rx.instructions ? `<tr><td valign="top"><b>Instructions</b></td><td>${rx.instructions}</td></tr>` : ""}
        </table>
        <div class="sig">
          <p><b>${rx.signatureName || rx.prescribedBy?.name || ""}</b></p>
          <p class="muted">${rx.isSigned ? `Signed ${new Date(rx.signedAt).toLocaleString()}` : "Unsigned"}</p>
        </div>
      </div>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };
  return <button onClick={openPrint} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Printer size={13} /></button>;
}

function ScanRxModal({ patients, onClose }: { patients: any[]; onClose: () => void }) {
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
      const r = await api.post("/prescriptions/scan", form, { headers: { "Content-Type": "multipart/form-data" } });
      setDocId(r.data.documentId);
      const base = { patient, medication: "", dosage: "", route: "", frequency: "", instructions: "", quantity: "", refills: 0 };
      setDraft(r.data.draft ? { ...base, ...r.data.draft } : base);
      if (!r.data.draft) setError("Could not read the photo — please fill the details manually below.");
      setStage("review");
    } catch (e: any) {
      setError(e.response?.data?.message || "Scan failed. Try again.");
      setStage("camera");
    }
  };

  const save = (d: any) => {
    const payload = { ...d, quantity: d.quantity ? Number(d.quantity) : null, endDate: d.endDate ? new Date(d.endDate) : null, attachments: docId ? [docId] : [] };
    api.post("/prescriptions", payload)
      .then(() => {
        toast.success("Prescription written");
        queryClient.invalidateQueries({ queryKey: ["rx"] });
        queryClient.invalidateQueries({ queryKey: ["rx-stats"] });
        setDocId(null);
        onClose();
      })
      .catch((e: any) => toast.error(e.response?.data?.message || "Failed to write"));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { if (stage !== "camera") { cleanup(); onClose(); } }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          {stage === "pick" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Scan prescription</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <p className="text-sm text-gray-500">Choose the patient, then take a photo of the prescription. AI will read it and fill the form for you.</p>
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
              <RxForm patients={patients} photo={photo} initial={draft} onSave={save}
                onClose={() => { cleanup(); onClose(); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Prescriptions() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["rx", statusFilter],
    queryFn: () => api.get(`/prescriptions${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => r.data),
  });
  const { data: stats } = useQuery({ queryKey: ["rx-stats"], queryFn: () => api.get("/prescriptions/stats").then(r => r.data) });
  const { data: patientData } = useQuery({ queryKey: ["rx-patients"], queryFn: () => api.get("/patients?limit=500").then(r => r.data) });

  const patients = patientData?.patients || [];
  const prescriptions = (data?.prescriptions || []).filter((r: any) => !search || r.patient?.name?.toLowerCase().includes(search.toLowerCase()) || r.medication?.toLowerCase().includes(search.toLowerCase()));

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/prescriptions", d),
    onSuccess: () => { toast.success("Prescription written"); queryClient.invalidateQueries({ queryKey: ["rx"] }); queryClient.invalidateQueries({ queryKey: ["rx-stats"] }); setShowForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to write"),
  });
  const signMut = useMutation({
    mutationFn: (id: string) => api.post(`/prescriptions/${id}/sign`),
    onSuccess: () => { toast.success("Prescription signed"); queryClient.invalidateQueries({ queryKey: ["rx"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to sign"),
  });
  const renewMut = useMutation({
    mutationFn: (id: string) => api.post(`/prescriptions/${id}/renew`),
    onSuccess: () => { toast.success("Renewed — new prescription created"); queryClient.invalidateQueries({ queryKey: ["rx"] }); queryClient.invalidateQueries({ queryKey: ["rx-stats"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to renew"),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/prescriptions/${id}`, { status }),
    onSuccess: () => { toast.success("Updated"); queryClient.invalidateQueries({ queryKey: ["rx"] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/prescriptions/${id}`),
    onSuccess: () => { toast.success("Prescription deleted"); queryClient.invalidateQueries({ queryKey: ["rx"] }); queryClient.invalidateQueries({ queryKey: ["rx-stats"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Write, sign and print prescriptions</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => setShowScan(true)}><Camera size={14} className="mr-1" /> Scan</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}><Plus size={14} className="mr-1" /> Write Rx</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats?.total ?? 0, cls: "text-gray-900", bg: "bg-gray-50" },
          { label: "Active", value: stats?.active ?? 0, cls: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Filled", value: stats?.filled ?? 0, cls: "text-blue-600", bg: "bg-blue-50" },
          { label: "Expired", value: stats?.expired ?? 0, cls: "text-gray-500", bg: "bg-gray-100" },
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
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or medication..." className="pl-9" />
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
      ) : prescriptions.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Pill size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No prescriptions</h3>
          <p className="text-gray-500 mb-4">Write the first prescription.</p>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus size={14} className="mr-1" /> Write Rx</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx: any) => (
            <Card key={rx._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200"><Pill className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="font-semibold text-gray-900">{rx.medication} {rx.dosage && <span className="text-gray-500 font-normal">· {rx.dosage}</span>}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{rx.patient?.name} · Rx by {rx.prescribedBy?.name || "—"} · {new Date(rx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${(STATUS_MAP[rx.status] || STATUS_MAP.active).cls}`}>{(STATUS_MAP[rx.status] || STATUS_MAP.active).label}</span>
                      {rx.isSigned ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">Signed</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">Unsigned</span>
                      )}
                      {rx.attachments?.length > 0 && <span className="inline-flex items-center gap-1 text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full"><ImageIcon size={12} /> photo</span>}
                      <RxPrint rx={rx} />
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                  {rx.frequency && <span className="px-2 py-1 bg-gray-100 rounded">{rx.frequency}</span>}
                  {rx.route && <span className="px-2 py-1 bg-gray-100 rounded capitalize">{rx.route}</span>}
                  {rx.quantity && <span className="px-2 py-1 bg-gray-100 rounded">Qty {rx.quantity}</span>}
                  {rx.refills > 0 && <span className="px-2 py-1 bg-gray-100 rounded">{rx.refills} refill(s)</span>}
                </div>
                {rx.instructions && <p className="text-sm text-gray-600 mt-2">{rx.instructions}</p>}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {!rx.isSigned && <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => signMut.mutate(rx._id)}><PenLine size={13} className="mr-1" /> Sign</Button>}
                  {rx.status === "active" && <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: rx._id, status: "filled" })}>Mark Filled</Button>}
                  {rx.status === "active" && <Button size="sm" variant="outline" onClick={() => renewMut.mutate(rx._id)}><RefreshCw size={13} className="mr-1" /> Renew</Button>}
                  {rx.status === "active" && <Button size="sm" variant="outline" className="text-red-500" onClick={() => statusMut.mutate({ id: rx._id, status: "cancelled" })}>Cancel</Button>}
                  <Button size="sm" variant="outline" className="text-red-500" onClick={() => { if (confirm("Delete this prescription?")) deleteMut.mutate(rx._id); }}><Trash2 size={13} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && <RxForm patients={patients} onSave={(d) => createMut.mutate(d)} onClose={() => setShowForm(false)} />}
      {showScan && <ScanRxModal patients={patients} onClose={() => setShowScan(false)} />}
    </div>
  );
}
