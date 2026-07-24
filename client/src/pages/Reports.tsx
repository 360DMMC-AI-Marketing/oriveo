import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { FileText, Download, Search, Loader2, CheckCircle2, AlertTriangle, Clock, FileSignature, User, Filter, ArrowUpDown, Printer, Stethoscope, Activity, Pill, AlertCircle, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const TRIAGE_COLORS = {
  0: { label: "Emergency", class: "text-red-700 bg-red-50 ring-red-600/20" },
  1: { label: "Urgent", class: "text-orange-700 bg-orange-50 ring-orange-600/20" },
  2: { label: "Semi-Urgent", class: "text-amber-700 bg-amber-50 ring-amber-600/20" },
  3: { label: "Non-Urgent", class: "text-blue-700 bg-blue-50 ring-blue-600/20" },
  4: { label: "Routine", class: "text-green-700 bg-green-50 ring-green-600/20" },
};

export default function Reports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["reports", page],
    queryFn: () => api.get(`/reports?page=${page}&limit=20`).then((r) => r.data),
  });

  const { data: singleReport, isLoading: loadingReport } = useQuery({
    queryKey: ["report", viewing?._id],
    queryFn: () => api.get(`/reports/${viewing._id}`).then((r) => r.data.report),
    enabled: !!viewing?._id,
  });

  const generateAllMutation = useMutation({
    mutationFn: () => api.post("/reports/generate-all"),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Generated ${res.data.generated} reports (${res.data.failed} failed)`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Generation failed"),
  });

  const signMutation = useMutation({
    mutationFn: ({ id, doctorNotes, digitalSignature }: { id: string; doctorNotes?: string; digitalSignature?: string }) =>
      api.put(`/reports/${id}/sign`, { doctorNotes, digitalSignature }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      toast.success("Report signed");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  const bulkSignMutation = useMutation({
    mutationFn: ({ ids, doctorNotes }: { ids: string[]; doctorNotes?: string }) =>
      api.post("/reports/bulk/sign", { ids, doctorNotes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setSelected(new Set());
      toast.success(`Signed ${res.data.modifiedCount} reports`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Bulk sign failed"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post("/reports/bulk/delete", { ids }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setSelected(new Set());
      toast.success(`Deleted ${res.data.deletedCount} reports`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Bulk delete failed"),
  });

  const reports = data?.reports || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const filtered = search
    ? reports.filter((r: any) =>
        r.patientInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.chiefComplaint?.toLowerCase().includes(search.toLowerCase())
      )
    : reports;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r: any) => r._id)));
    }
  };

  const handleBulkSign = () => {
    if (selected.size === 0) return;
    const notes = prompt("Doctor's notes for selected reports (optional):");
    bulkSignMutation.mutate({ ids: Array.from(selected), doctorNotes: notes || undefined });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected reports? This cannot be undone.`)) return;
    bulkDeleteMutation.mutate(Array.from(selected));
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const response = await api.get(`/reports/${id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${id.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  const handleDownloadFhir = async (id: string) => {
    try {
      const response = await api.get(`/reports/${id}/fhir`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/fhir+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${id.slice(-8)}.fhir.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download FHIR");
    }
  };

  const triageBadge = (level: number) => {
    const t = TRIAGE_COLORS[level as keyof typeof TRIAGE_COLORS] || TRIAGE_COLORS[3];
    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${t.class}`}>{t.label}</span>;
  };

  if (viewing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setViewing(null)} className="gap-1 text-sm">&larr; Back to reports</Button>
        {loadingReport ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : singleReport ? (
          <PrintableReport report={singleReport} user={user} signMutation={signMutation} onDownloadPdf={handleDownloadPdf} onDownloadFhir={handleDownloadFhir} />
        ) : (
          <p className="text-center text-gray-500 py-8">Report not found</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
          <p className="text-gray-500">{total} reports generated</p>
        </div>
        <Button onClick={() => generateAllMutation.mutate()} disabled={generateAllMutation.isPending} className="gap-1.5">
          {generateAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Generate All Missing
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search by patient name or complaint..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-light rounded-lg border border-primary/20 no-print">
          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm font-medium text-primary flex-1">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkSign} disabled={bulkSignMutation.isPending} className="gap-1">
            {bulkSignMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSignature className="h-3.5 w-3.5" />}
            Sign
          </Button>
          {user?.role === "admin" && (
            <Button size="sm" variant="outline" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
              {bulkDeleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Delete
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No reports yet. Click "Generate All Missing" to create them.</p>
        ) : (
          filtered.map((report: any) => (
            <div key={report._id}
              className="rounded-lg border p-4 hover:border-primary/50 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input type="checkbox" checked={selected.has(report._id)} onChange={() => toggleSelect(report._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0 no-print" />
                  <button onClick={() => setViewing(report)} className="text-left min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{report.patientInfo?.name || "Unknown Patient"}</h3>
                      {triageBadge(report.triageLevel)}
                      {report.doctorSigned && <span title="Signed"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /></span>}
                    </div>
                    {report.chiefComplaint && (
                      <p className="text-sm text-gray-600 line-clamp-1">{report.chiefComplaint}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{report.callDuration ? `${Math.floor(report.callDuration / 60)}m` : "-"}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{report.callDate ? new Date(report.callDate).toLocaleDateString() : "-"}</span>
                      {report.doctorSigned && report.signedBy && (
                        <span className="flex items-center gap-1"><FileSignature className="h-3 w-3" />Signed</span>
                      )}
                    </div>
                  </button>
                </div>
                <div className="flex gap-1 shrink-0">
                  {report.redFlags?.length > 0 && <span title={`${report.redFlags.length} red flags`}><AlertTriangle className="h-4 w-4 text-red-400" /></span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

function SignaturePad({ onSignature }: { onSignature: (sig: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.beginPath();
    ctx.setLineDash([]);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
    if (hasDrawn && canvasRef.current) {
      onSignature(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onSignature("");
  };

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height: 120 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <svg className="h-8 w-8 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <span className="text-xs text-gray-400 font-medium">Draw your signature here</span>
          </div>
        )}
      </div>
      <button type="button" onClick={clearPad} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">Clear signature</button>
    </div>
  );
}

function PrintableReport({ report, user, signMutation, onDownloadPdf, onDownloadFhir }: { report: any; user: any; signMutation: any; onDownloadPdf: (id: string) => void; onDownloadFhir: (id: string) => void }) {
  const [doctorNotes, setDoctorNotes] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [showSign, setShowSign] = useState(false);
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [agreed, setAgreed] = useState(false);

  const handlePrint = () => window.print();

  const handleSign = () => {
    const sig = signMode === "type" ? signatureName : signatureImage;
    signMutation.mutate({ id: report._id, doctorNotes, digitalSignature: sig || undefined });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <span className="text-lg leading-none">&larr;</span> Back to reports
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5"><Printer className="h-3.5 w-3.5" /> Print</Button>
          <Button variant="outline" size="sm" onClick={() => onDownloadPdf(report._id)} className="gap-1.5"><Download className="h-3.5 w-3.5" /> PDF</Button>
          <Button variant="outline" size="sm" onClick={() => onDownloadFhir(report._id)} className="gap-1.5"><Activity className="h-3.5 w-3.5" /> FHIR</Button>
          {!report.doctorSigned && (user?.role === "admin" || user?.role === "doctor") && (
            <Button size="sm" onClick={() => setShowSign(true)} className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
              <FileSignature className="h-3.5 w-3.5" /> Sign Report
            </Button>
          )}
        </div>
      </div>

      {/* Signing Overlay */}
      {showSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setShowSign(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Sign header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-7 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center">
                    <FileSignature className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Sign Report</h3>
                    <p className="text-xs text-slate-400">Electronic signature for {report.patientInfo?.name || "this report"}</p>
                  </div>
                </div>
                <button onClick={() => setShowSign(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <X className="h-4 w-4 text-slate-300" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Signer info */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {(user?.name || "D").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || "Doctor"}</p>
                  <p className="text-xs text-slate-400">
                    {user?.role === "doctor" ? "Physician" : user?.role === "admin" ? "Administrator" : "Staff"}
                    {user?.specialty ? ` · ${user.specialty}` : ""}
                  </p>
                </div>
              </div>

              {/* Signature mode tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setSignMode("draw")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${signMode === "draw" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Draw
                </button>
                <button
                  onClick={() => setSignMode("type")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${signMode === "type" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Type
                </button>
              </div>

              {/* Signature area */}
              {signMode === "draw" ? (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Your signature</label>
                  <SignaturePad onSignature={(img) => setSignatureImage(img)} />
                  <p className="text-[11px] text-slate-400 mt-2">Draw your signature using your mouse or finger. This is your legally binding electronic signature.</p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Type your full name</label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder={user?.name || "Dr. John Smith"}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-lg focus:border-slate-900 focus:ring-0 outline-none transition-colors"
                    style={{ fontFamily: "'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive", fontSize: "1.5rem" }}
                  />
                  <p className="text-[11px] text-slate-400 mt-2">This serves as your legally binding electronic signature.</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Clinical Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm min-h-[72px] focus:border-slate-900 focus:ring-0 outline-none transition-colors resize-none" placeholder="Add clinical notes, observations, or follow-up instructions..." />
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                  I certify that this report accurately reflects the clinical encounter and I approve it for the medical record.
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setShowSign(false); setSignatureName(""); setSignatureImage(""); setAgreed(false); }} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleSign}
                  disabled={signMutation.isPending || !agreed || (signMode === "type" ? !signatureName.trim() : !signatureImage)}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-40 disabled:shadow-none"
                >
                  {signMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {signMutation.isPending ? "Signing..." : "Sign & Approve"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The report document */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden report-print-area">
        <div className="bg-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Medical Call Report</h2>
              <p className="text-sm text-gray-500">Auto-generated from AI-patient conversation</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Report ID: {report._id?.slice(-8)}</p>
              <p>{report.callDate ? new Date(report.callDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          <Section icon={User} title="Patient Information">
            <Row label="Name" value={report.patientInfo?.name} />
            <Row label="Age" value={report.patientInfo?.age} />
            <Row label="Gender" value={report.patientInfo?.gender} />
            <Row label="Phone" value={report.patientInfo?.phone} />
            <Row label="Duration" value={report.callDuration ? `${Math.floor(report.callDuration / 60)}m ${report.callDuration % 60}s` : ""} />
          </Section>

          <Section icon={AlertCircle} title="Chief Complaint">
            <p className="text-sm text-gray-700">{report.chiefComplaint || "N/A"}</p>
          </Section>

          {report.symptomsCaptured?.length > 0 && (
            <Section icon={Stethoscope} title="Symptoms Captured">
              <div className="grid gap-1.5">
                {report.symptomsCaptured.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    <span className="font-medium">{s.symptom}</span>
                    {s.severity && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        s.severity === "severe" ? "bg-red-50 text-red-600" :
                        s.severity === "moderate" ? "bg-amber-50 text-amber-600" :
                        "bg-green-50 text-green-600"
                      }`}>{s.severity}</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {report.redFlags?.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-4 w-4" /> Red Flags
              </h4>
              <ul className="space-y-0.5">
                {report.redFlags.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-red-600 flex items-start gap-1.5"><span className="mt-0.5">•</span>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <Section icon={Activity} title="Triage Assessment">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ring-1 ${
                TRIAGE_COLORS[report.triageLevel as keyof typeof TRIAGE_COLORS]?.class || TRIAGE_COLORS[3].class
              }`}>
                {TRIAGE_COLORS[report.triageLevel as keyof typeof TRIAGE_COLORS]?.label || "Unknown"}
              </span>
              <span className="text-sm text-gray-500">Level {report.triageLevel}</span>
            </div>
          </Section>

          <Section icon={FileText} title="AI Assessment">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.aiAssessment || "N/A"}</p>
          </Section>

          <Section icon={FileText} title="Advice Given">
            <p className="text-sm text-gray-700">{report.adviceGiven || "N/A"}</p>
          </Section>

          {(report.medicationsReviewed || report.allergiesFlagged || report.chronicConditions) && (
            <Section icon={Pill} title="Medical Context">
              {report.medicationsReviewed && <Row label="Medications Reviewed" value={report.medicationsReviewed} />}
              {report.allergiesFlagged && <Row label="Allergies Flagged" value={report.allergiesFlagged} />}
              {report.chronicConditions && <Row label="Chronic Conditions" value={report.chronicConditions} />}
              {report.vitalsMentioned && <Row label="Vitals Mentioned" value={report.vitalsMentioned} />}
            </Section>
          )}

          {report.keyExchanges?.length > 0 && (
            <Section icon={FileText} title="Key Exchanges">
              <div className="space-y-2">
                {report.keyExchanges.map((e: any, i: number) => (
                  <div key={i} className={`rounded-lg p-2.5 text-sm ${e.speaker === "AI" ? "bg-blue-50" : "bg-gray-50"}`}>
                    <span className={`text-xs font-medium ${e.speaker === "AI" ? "text-blue-600" : "text-gray-500"}`}>
                      {e.speaker}
                    </span>
                    <p className="text-gray-700 mt-0.5">{e.text}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {report.nextSteps?.length > 0 && (
            <Section icon={CheckCircle2} title="Next Steps">
              <ul className="space-y-1">
                {report.nextSteps.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {report.aiQaScores?.overall && (
            <Section icon={Activity} title="AI Quality Scores">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(report.aiQaScores).filter(([k]) => k !== "_id").map(([key, val]) => (
                  val != null && (
                    <div key={key} className="rounded-lg border bg-gray-50/50 p-2.5 text-center">
                      <p className="text-xs text-gray-500 capitalize">{key}</p>
                      <p className={`text-lg font-bold ${Number(val) >= 80 ? "text-emerald-600" : Number(val) >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {Math.round(Number(val))}%
                      </p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          <Section icon={FileText} title="Clinical Summary">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.callSummary || "N/A"}</p>
          </Section>

          {/* Footer with signature */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Generated by AI {report.generatedBy?.name ? `(${report.generatedBy.name})` : ""}</p>
              <p>{report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}</p>
            </div>

            {report.doctorSigned && (
              <div className="mt-6">
                {/* Realistic signed document look */}
                <div className="relative rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 overflow-hidden">
                  {/* Watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-slate-100/60 select-none pointer-events-none rotate-[-15deg]">SIGNED</div>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Signature Block</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="flex items-start gap-6">
                      {/* Signature */}
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Physician Signature</p>
                        {report.digitalSignature && report.digitalSignature.startsWith("data:") ? (
                          <div className="border-b-2 border-slate-900 pb-1 mb-2 inline-block">
                            <img src={report.digitalSignature} alt="Signature" className="h-14" style={{ filter: "contrast(1.2)" }} />
                          </div>
                        ) : (
                          <div className="border-b-2 border-slate-900 pb-1 mb-2 inline-block">
                            <span className="text-2xl text-slate-900" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive" }}>
                              {report.digitalSignature || report.signedBy?.name || "Doctor"}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span className="font-semibold">{report.signedBy?.name || "Doctor"}{report.signatureTitle ? `, ${report.signatureTitle}` : ""}</span>
                          <span className="text-slate-400">|</span>
                          <span>{report.signedAt ? new Date(report.signedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
                          <span className="text-slate-400">|</span>
                          <span>{report.signedAt ? new Date(report.signedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                        </div>
                      </div>

                      {/* Verification badge */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-2">
                        <div className="w-16 h-16 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center">
                          <div className="text-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                            <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {report.doctorNotes && (
                      <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Clinical Notes</p>
                        <p className="text-sm text-slate-700 bg-amber-50/50 rounded-lg p-3 border border-amber-100 italic">{report.doctorNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
        <Icon className="h-4 w-4 text-gray-400" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}


