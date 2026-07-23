import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import VoiceAgent from "@/components/VoiceAgent";
import VoiceInputButton from "@/components/VoiceInputButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search, Phone, Bot, Headphones, Settings2, Activity, Globe,
  ChevronDown, ChevronRight, X, Users, Calendar, User, Loader2, Plus, FileText,
  PhoneIncoming, PhoneOutgoing, CheckCircle, Clock, XCircle, Siren,
  Star, Brain, ArrowRight, AlertTriangle, Radio
} from "lucide-react";
import { medicalTemplates } from "@/data/medicalTemplates";

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "es", label: "Spanish" },
  { code: "fr", label: "French" }, { code: "de", label: "German" },
  { code: "it", label: "Italian" }, { code: "pt", label: "Portuguese" },
  { code: "zh", label: "Chinese" }, { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" }, { code: "hi", label: "Hindi" },
];

type Tab = "quick" | "batch" | "live" | "history";

interface ActiveCall {
  callId: string;
  callSid: string;
  startedAt: number;
  duration: number;
  patient: { _id: string; name: string; phone: string } | null;
  status: string;
  direction: string;
  language: string;
  severity: number | null;
  lastTranscript: { question?: string; answer?: string } | null;
}

interface TranscriptEvent {
  callId: string;
  role: "patient" | "ai";
  text: string;
  timestamp: number;
}

interface SeverityEvent {
  callId: string;
  tier: number;
  from: number;
  isCrisis: boolean;
  timestamp: number;
}

const callTranscripts: Record<string, TranscriptEvent[]> = {};
const callSeverities: Record<string, number> = {};

export default function CallCenter() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("quick");

  // ===== Quick Call state =====
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callLanguage, setCallLanguage] = useState("en");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedQId, setSelectedQId] = useState("");
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);

  // ===== Batch Schedule state =====
  const [campaignName, setCampaignName] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchQId, setBatchQId] = useState("");
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  // ===== Live Monitoring state =====
  const [expandedCalls, setExpandedCalls] = useState<Record<string, boolean>>({});
  const [liveTranscripts, setLiveTranscripts] = useState<Record<string, TranscriptEvent[]>>({});
  const [liveSeverities, setLiveSeverities] = useState<Record<string, number>>({});

  // ===== History state =====
  const [historySearch, setHistorySearch] = useState("");
  const [historyTab, setHistoryTab] = useState("all");

  // ===== Shared queries =====
  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
  });
  const { data: callsData } = useQuery({
    queryKey: ["calls", "in-progress"],
    queryFn: () => api.get("/calls?status=in-progress").then((r) => r.data),
  });
  const { data: questionnairesData } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: () => api.get("/questionnaires").then((r) => r.data),
  });
  const { data: groupsRes } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.get("/groups").then((r) => r.data),
  });

  const { data: activeCallsData, isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ["active-calls"],
    queryFn: () => api.get("/calls/active").then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["calls", "history"],
    queryFn: () => api.get("/calls?direction=inbound").then((r) => r.data),
  });

  const patients = patientsData?.patients || [];
  const activeCalls = callsData?.calls || [];
  const savedQuestionnaires = questionnairesData?.questionnaires || [];
  const groups = groupsRes?.groups || [];
  const realtimeCalls: ActiveCall[] = activeCallsData?.activeCalls || [];
  const historyCalls = historyData?.calls || [];

  const memberIds = new Set<string>();
  for (const g of groups) {
    for (const m of g.members || []) memberIds.add(m._id);
  }

  // ===== Live Monitoring WebSocket =====
  useEffect(() => {
    if (tab !== "live") return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("join-supervisor");

    const handleTranscript = (event: TranscriptEvent) => {
      const { callId } = event;
      if (!callTranscripts[callId]) callTranscripts[callId] = [];
      callTranscripts[callId].push(event);
      if (callTranscripts[callId].length > 50) callTranscripts[callId].shift();
      setLiveTranscripts({ ...callTranscripts });
    };
    const handleSeverity = (event: SeverityEvent) => {
      callSeverities[event.callId] = event.tier;
      setLiveSeverities({ ...callSeverities });
    };
    socket.on("call:transcript", handleTranscript);
    socket.on("call:severity", handleSeverity);
    return () => {
      socket.emit("leave-supervisor");
      socket.off("call:transcript", handleTranscript);
      socket.off("call:severity", handleSeverity);
    };
  }, [tab]);

  // ===== URL params (from Appointments "Call" button) =====
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    const patientName = searchParams.get("patientName");
    if (patientId && patientName && tab === "quick") {
      const patient = patients.find((p: any) => p._id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setSearch(patient.name);
        startOutboundCall(patient);
      } else {
        setSearch(patientName);
      }
      setSearchParams({}, { replace: true });
    }
  }, [patients, searchParams, tab]);

  // ===== Quick Call handlers =====
  const filteredPatients = patients.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const handleQuestionnaireSelect = (value: string) => {
    setSelectedQId(value);
    if (value.startsWith("template_")) {
      const template = medicalTemplates.find((t) => t.id === value.replace("template_", ""));
      setSelectedQuestions(template?.questions || []);
    } else if (value) {
      const q = savedQuestionnaires.find((q: any) => q._id === value);
      setSelectedQuestions(q?.questions?.map((q: any) => (typeof q === "string" ? q : q.text)) || []);
    } else {
      setSelectedQuestions([]);
    }
  };

  const startOutboundCall = async (patient: any) => {
    if (!patient?.phone) { toast.error("Patient has no phone number"); return; }
    try {
      const payload: any = { patientId: patient._id };
      if (selectedQId && !selectedQId.startsWith("template_")) {
        payload.questionnaireId = selectedQId;
      } else if (selectedQuestions.length > 0) {
        payload.customQuestions = selectedQuestions;
      }
      const { data } = await api.post("/voice/outbound", payload);
      setActiveCallId(data.call._id);
      setSelectedPatient(patient);
      toast.success(`Calling ${patient.name}...`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start call");
    }
  };

  const handleQuickCall = () => {
    if (!selectedPatient) { toast.error("Select a patient first"); return; }
    startOutboundCall(selectedPatient);
  };

  // ===== Batch Schedule handlers =====
  const batchFilteredPatients = batchSearch
    ? patients.filter((p: any) => p.name.toLowerCase().includes(batchSearch.toLowerCase()) || p.phone.includes(batchSearch))
    : patients;

  function togglePatient(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleGroup(group: any) {
    const next = new Set(selectedIds);
    const mIds = (group.members || []).map((m: any) => m._id);
    const allSelected = mIds.every((id: string) => next.has(id));
    if (allSelected) mIds.forEach((id: string) => next.delete(id));
    else mIds.forEach((id: string) => next.add(id));
    setSelectedIds(next);
  }

  function isGroupSelected(group: any): boolean {
    const mIds = (group.members || []).map((m: any) => m._id);
    return mIds.length > 0 && mIds.every((id: string) => selectedIds.has(id));
  }

  function isGroupPartiallySelected(group: any): boolean {
    const mIds = (group.members || []).map((m: any) => m._id);
    const count = mIds.filter((id: string) => selectedIds.has(id)).length;
    return count > 0 && count < mIds.length;
  }

  function addQuestion() {
    const q = newQuestion.trim();
    if (!q) return;
    setCustomQuestions([...customQuestions, q]);
    setNewQuestion("");
  }

  function removeQuestion(idx: number) {
    setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
  }

  const startCampaign = useMutation({
    mutationFn: (data: any) => api.post("/batch/start", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-campaigns"] });
      toast.success("Calls scheduled");
      setCampaignName("");
      setSelectedIds(new Set());
      setScheduleDate("");
      setScheduleTime("");
      setBatchQId("");
      setCustomQuestions([]);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
  });

  function handleScheduleSubmit() {
    if (!campaignName.trim()) { toast.error("Campaign name required"); return; }
    if (selectedIds.size === 0) { toast.error("Select at least one patient"); return; }
    const scheduledAt = scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : undefined;
    startCampaign.mutate({
      name: campaignName.trim(),
      patientIds: [...selectedIds],
      scheduledAt,
      questionnaireId: batchQId || undefined,
      customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
    });
  }

  // ===== Live Monitoring helpers =====
  const toggleExpandLive = (callId: string) => {
    setExpandedCalls((prev) => ({ ...prev, [callId]: !prev[callId] }));
  };

  const getSeverityColor = (severity: number | null) => {
    if (severity === null) return "text-gray-400";
    if (severity <= 2) return "text-emerald-600";
    if (severity <= 5) return "text-amber-600";
    return "text-red-600";
  };

  const getSeverityBg = (severity: number | null) => {
    if (severity === null) return "bg-gray-100";
    if (severity <= 2) return "bg-emerald-50 border-emerald-200";
    if (severity <= 5) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const formatDuration = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ===== History helpers =====
  const historyFiltered = historyCalls.filter((c: any) => {
    const name = c.patient?.name || "Unknown";
    const phone = c.patient?.phone || "";
    const s = historySearch.toLowerCase();
    return name.toLowerCase().includes(s) || phone.includes(s);
  });

  const isAnswered = (c: any) => c.patientResponded === true;
  const isUnanswered = (c: any) => c.patientResponded === false || c.status === "failed";
  const isEmergency = (c: any) => c.emergencyDetected || (c.aiSeverityScore || 0) >= 7;

  const historyTabCalls = (() => {
    switch (historyTab) {
      case "answered": return historyFiltered.filter(isAnswered);
      case "unanswered": return historyFiltered.filter(isUnanswered);
      case "emergency": return historyFiltered.filter(isEmergency);
      default: return historyFiltered;
    }
  })();

  const getStatusBadge = (call: any) => {
    if (call.emergencyDetected) {
      return <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1"><Siren className="h-3 w-3" /> Emergency</Badge>;
    }
    switch (call.status) {
      case "completed": return <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case "in-progress": return <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case "failed": return <Badge className="bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      case "transferred": return <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1"><Headphones className="h-3 w-3" /> Transferred</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700">{call.status}</Badge>;
    }
  };

  const getQAScore = (call: any) => {
    if (call.qaScore?.overall) return call.qaScore.overall;
    if (!call.aiSummary) return null;
    return Math.min(100, Math.max(60,
      70 + (call.patientResponded ? 10 : 0) + (call.duration > 30 ? 10 : 0) + ((call.aiSeverityScore || 0) > 0 ? 10 : 0)
    ));
  };

  const TAB_CONFIG = [
    { id: "quick" as Tab, label: "Quick Call", icon: Phone },
    { id: "batch" as Tab, label: "Batch", icon: Users },
    { id: "live" as Tab, label: "Live", icon: Radio, badge: realtimeCalls.length || undefined },
    { id: "history" as Tab, label: "History", icon: FileText, badge: historyCalls.length || undefined },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Center</h1>
          <p className="text-muted-foreground text-sm">Make calls, monitor live conversations, and review history</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select value={callLanguage} onChange={(e) => setCallLanguage(e.target.value)}
              className="border-0 bg-transparent text-sm font-medium outline-none cursor-pointer">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Agent settings available in the Settings page")}>
            <Settings2 className="h-4 w-4" /> Settings
          </Button>
          {tab === "quick" && (
            <Button variant="outline" size="sm" onClick={() => setShowTestPanel(!showTestPanel)}>
              {showTestPanel ? "Hide Test" : "Test Agent"}
            </Button>
          )}
          {tab === "live" && (
            <Button variant="outline" size="sm" onClick={() => refetchActive()}>Refresh</Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Active Calls</CardTitle>
            <Phone className="h-3.5 w-3.5 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{activeCalls.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Calls</CardTitle>
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{historyCalls.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Patients</CardTitle>
            <Activity className="h-3.5 w-3.5 text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{patients.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Status</CardTitle>
            <Bot className="h-3.5 w-3.5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TAB_CONFIG.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="h-4 w-4" /> {t.label}
              {t.badge !== undefined && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============ TAB: Quick Call ============ */}
      {tab === "quick" && (
        <>
          <Card className="border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Search Patient</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Type patient name or phone..." value={search}
                      onChange={(e) => { setSearch(e.target.value); setSelectedPatient(null); }}
                      className="pl-9 h-10" />
                  </div>
                  {search && !selectedPatient && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded-lg shadow-lg">
                      {filteredPatients.slice(0, 8).map((p: any) => (
                        <button key={p._id} onClick={() => { setSelectedPatient(p); setSearch(p.name); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between border-b last:border-0">
                          <div>
                            <span className="font-medium">{p.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{p.phone}</span>
                          </div>
                          {p.language && p.language !== "en" && (
                            <span className="text-[10px] uppercase text-muted-foreground/60 border rounded px-1">{p.language}</span>
                          )}
                        </button>
                      ))}
                      {filteredPatients.length === 0 && (
                        <p className="px-3 py-2 text-sm text-gray-400">No patients found</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-56 relative">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Template (optional)</label>
                  <button onClick={() => setShowTemplatePanel(!showTemplatePanel)}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm hover:bg-gray-50">
                    <span className={selectedQId ? "" : "text-gray-400"}>
                      {selectedQId
                        ? (selectedQId.startsWith("template_")
                          ? medicalTemplates.find(t => t.id === selectedQId.replace("template_", ""))?.condition
                          : savedQuestionnaires.find((q: any) => q._id === selectedQId)?.title)
                        : "No template"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  {showTemplatePanel && (
                    <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button onClick={() => { setSelectedQId(""); setSelectedQuestions([]); setShowTemplatePanel(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b font-medium text-gray-500">
                        No template (general conversation)
                      </button>
                      <div className="border-b px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Medical Templates</div>
                      {medicalTemplates.map((t) => (
                        <button key={t.id} onClick={() => { handleQuestionnaireSelect(`template_${t.id}`); setShowTemplatePanel(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0 flex items-center justify-between">
                          <span>{t.condition}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{t.severity}</span>
                        </button>
                      ))}
                      {savedQuestionnaires.length > 0 && (
                        <>
                          <div className="border-b px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Saved Questionnaires</div>
                          {savedQuestionnaires.map((q: any) => (
                            <button key={q._id} onClick={() => { handleQuestionnaireSelect(q._id); setShowTemplatePanel(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{q.title}</button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">&nbsp;</label>
                  <Button onClick={handleQuickCall} disabled={!selectedPatient} className="h-10 gap-2 px-6">
                    <Phone className="h-4 w-4" /> Call Now
                  </Button>
                </div>
              </div>
              {selectedPatient && (
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{selectedPatient.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{selectedPatient.phone}</span>
                  </div>
                  {selectedPatient.language && selectedPatient.language !== "en" && (
                    <span className="text-xs uppercase text-muted-foreground/60 border rounded px-1">{selectedPatient.language}</span>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedPatient(null); setSearch(""); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {selectedQuestions.length > 0 && (
                <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500">{selectedQuestions.length} questions selected</p>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] text-gray-400" onClick={() => { setSelectedQId(""); setSelectedQuestions([]); }}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {activeCallId && selectedPatient && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="py-3 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium">Active call with {selectedPatient.name}</span>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => setActiveCallId(null)}>End Call</Button>
              </CardContent>
            </Card>
          )}

          {activeCalls.length > 0 && !activeCallId && (
            <Card>
              <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm">Active Calls on Server</CardTitle></CardHeader>
              <CardContent className="pb-3 space-y-2">
                {activeCalls.map((call: any) => (
                  <div key={call._id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-sm font-medium">{call.patient?.name || "Unknown"}</span>
                    <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium">{call.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {showTestPanel && (
            <Card>
              <CardHeader className="pb-2 pt-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Browser Voice Test</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTestPanel(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pb-3">
                <VoiceAgent language={callLanguage} questions={selectedQuestions} onCallEnd={() => setActiveCallId(null)} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ============ TAB: Batch Schedule ============ */}
      {tab === "batch" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search patients..." className="pl-10" value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)} />
            </div>
            {groups.length > 0 && (
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                  <Users className="h-4 w-4" /> Groups &mdash; check a group to call all its members
                </h2>
                <div className="grid gap-1 sm:grid-cols-2">
                  {groups.map((g: any) => {
                    const members = g.members || [];
                    const checked = isGroupSelected(g);
                    const partial = isGroupPartiallySelected(g);
                    return (
                      <label key={g._id} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={checked}
                          ref={(el) => { if (el) el.indeterminate = partial; }}
                          onChange={() => toggleGroup(g)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0" />
                        <Users className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium flex-1">{g.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{members.length} patients</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                <User className="h-4 w-4" /> Patients <span className="text-xs text-muted-foreground font-normal">({batchFilteredPatients.length})</span>
              </h2>
              <div className="grid gap-1 sm:grid-cols-2">
                {batchFilteredPatients.map((p: any) => (
                  <label key={p._id} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(p._id)} onChange={() => togglePatient(p._id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.phone}</div>
                    </div>
                    {memberIds.has(p._id) && <span className="text-[10px] text-gray-400 shrink-0">in group</span>}
                    {p.primaryDiagnosis && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 truncate shrink-0">{p.primaryDiagnosis}</span>
                    )}
                  </label>
                ))}
                {batchFilteredPatients.length === 0 && (
                  <p className="text-sm text-gray-400 col-span-2 py-4 text-center">No patients found.</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3 pt-4"><CardTitle className="text-sm">Campaign Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Campaign Name *</label>
                  <Input placeholder="e.g., Weekly Checkup" value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> Schedule</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-9 text-sm" />
                    <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-9 text-sm" />
                  </div>
                  {!scheduleDate && <p className="text-[10px] text-muted-foreground">Leave empty to call immediately</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium flex items-center gap-1"><FileText className="h-3 w-3" /> Questions to Ask</label>
                  <select value={batchQId} onChange={(e) => setBatchQId(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm">
                    <option value="">No template</option>
                    {savedQuestionnaires.map((q: any) => <option key={q._id} value={q._id}>{q.name}</option>)}
                  </select>
                  <div className="text-center text-[10px] text-muted-foreground">&mdash; or add custom questions &mdash;</div>
                  {customQuestions.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {customQuestions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1.5 text-xs">
                          <span className="flex-1">{q}</span>
                          <button onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Input placeholder="Type a question..." value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuestion(); } }}
                      className="h-8 text-xs flex-1" />
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0"
                      onClick={addQuestion} disabled={!newQuestion.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Selected patients</span>
                    <span className="font-bold text-lg">{selectedIds.size}</span>
                  </div>
                  {selectedIds.size > 0 && (
                    <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                      {[...selectedIds].slice(0, 20).map((id) => {
                        const p = patients.find((p: any) => p._id === id);
                        if (!p) return null;
                        return (
                          <div key={id} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="truncate">{p.name}</span>
                            <button onClick={() => togglePatient(id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-1">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                      {selectedIds.size > 20 && <p className="text-xs text-gray-400">...and {selectedIds.size - 20} more</p>}
                    </div>
                  )}
                </div>
                <Button className="w-full gap-2" disabled={startCampaign.isPending || selectedIds.size === 0}
                  onClick={handleScheduleSubmit}>
                  {startCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                  {scheduleDate ? "Schedule Calls" : "Call Now"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============ TAB: Live ============ */}
      {tab === "live" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1.5 gap-1.5">
                <Activity className="h-4 w-4" /> {realtimeCalls.length} Active
              </Badge>
            </div>
          </div>

          {loadingActive ? (
            <p className="text-gray-500 py-8 text-center">Loading active calls...</p>
          ) : realtimeCalls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Headphones className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active calls</p>
                <p className="text-sm text-gray-400 mt-1">Active AI calls will appear here in real-time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {realtimeCalls.map((call) => {
                const isExpanded = expandedCalls[call.callId];
                const severity = liveSeverities[call.callId] ?? call.severity;
                const transcripts = liveTranscripts[call.callId] || [];
                const lastTranscript = transcripts.length > 0 ? transcripts[transcripts.length - 1] : null;
                return (
                  <Card key={call.callId} className={`border-l-4 ${getSeverityBg(severity)}`}>
                    <CardContent className="p-0">
                      <button onClick={() => toggleExpandLive(call.callId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            call.direction === "inbound" ? "bg-blue-100" : "bg-emerald-100"
                          }`}>
                            {call.direction === "inbound"
                              ? <PhoneIncoming className="h-5 w-5 text-blue-600" />
                              : <PhoneOutgoing className="h-5 w-5 text-emerald-600" />}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{call.patient?.name || "Unknown Patient"}</span>
                              <span className={`text-xs font-medium ${getSeverityColor(severity)}`}>
                                {severity != null ? `Severity: ${severity}` : "Severity: —"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(call.duration)}</span>
                              <span className="capitalize">{call.direction}</span>
                              <span>{call.language.toUpperCase()}</span>
                              {lastTranscript && (
                                <span className="truncate max-w-[300px] text-gray-400">&ldquo;{lastTranscript.text.substring(0, 80)}...&rdquo;</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Link to={`/calls/${call.callId}`}>
                            <Button variant="ghost" size="sm" className="gap-1"><Phone className="h-3.5 w-3.5" /> View</Button>
                          </Link>
                          {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t px-4 py-3 space-y-3">
                          {transcripts.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                              <Brain className="h-4 w-4" /><span>Waiting for transcript data...</span>
                            </div>
                          ) : (
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {transcripts.map((t, i) => (
                                <div key={i} className={`flex items-start gap-2 text-sm p-2 rounded ${
                                  t.role === "ai" ? "bg-primary/5" : "bg-gray-50"
                                }`}>
                                  <span className={`shrink-0 font-bold text-xs uppercase ${
                                    t.role === "ai" ? "text-primary" : "text-gray-500"
                                  }`}>{t.role === "ai" ? "AI" : "P"}</span>
                                  <span className="text-gray-700">{t.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {call.patient && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-2">
                              <User className="h-3 w-3" /><span>{call.patient.name} &middot; {call.patient.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============ TAB: History ============ */}
      {tab === "history" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Call History</CardTitle>
              <div className="relative flex-1 max-w-xs flex gap-2 items-center justify-end">
                <div className="relative flex-1 max-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search by patient name or phone..." value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)} className="pl-9 h-9 text-sm" />
                </div>
                <VoiceInputButton onResult={(text) => setHistorySearch(text)} size="sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 border-b mb-4">
              {[
                { value: "all", label: "All", count: historyFiltered.length },
                { value: "answered", label: "Answered", count: historyFiltered.filter(isAnswered).length },
                { value: "unanswered", label: "Unanswered", count: historyFiltered.filter(isUnanswered).length },
                { value: "emergency", label: "Emergency", count: historyFiltered.filter(isEmergency).length, danger: true },
              ].map((t) => (
                <button key={t.value} onClick={() => setHistoryTab(t.value)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    historyTab === t.value
                      ? t.danger ? "border-red-500 text-red-600" : "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {loadingHistory ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : historyTabCalls.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <PhoneIncoming className="mx-auto h-10 w-10 mb-2" />
                  <p className="text-sm">No calls found</p>
                </div>
              ) : (
                historyTabCalls.map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`}
                    className="block rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        call.emergencyDetected ? "bg-red-100" :
                        isAnswered(call) ? "bg-emerald-100" :
                        call.status === "in-progress" ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                        {call.emergencyDetected ? (
                          <Siren className="h-5 w-5 text-red-600" />
                        ) : (
                          <PhoneIncoming className={`h-5 w-5 ${
                            isAnswered(call) ? "text-emerald-600" :
                            call.status === "in-progress" ? "text-blue-600" : "text-gray-400"
                          }`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">{call.patient?.name || "Unknown Caller"}</span>
                          {getStatusBadge(call)}
                          {call.aiSeverityScore && (
                            <span className={`text-xs font-medium ${
                              call.aiSeverityScore >= 7 ? "text-red-600" :
                              call.aiSeverityScore >= 4 ? "text-amber-600" : "text-emerald-600"
                            }`}>{call.aiSeverityScore}/10</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 flex-wrap">
                          <span>{call.patient?.phone || "No caller ID"}</span>
                          <span>&middot;</span>
                          <span>{new Date(call.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {call.emergencyActionTaken !== "none" && (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-1">
                            {call.emergencyActionTaken === "called_911" ? "911 Called" :
                             call.emergencyActionTaken === "called_clinic" ? "Clinic Called" : "Action Taken"}
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                    {call.duration > 0 && (
                      <div className="mt-2 ml-13 pl-13 border-t border-gray-100 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" /><span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span></div>
                        {call.transcript && call.transcript.length > 0 && (
                          <div className="flex items-center gap-1"><FileText className="h-3 w-3 text-gray-400" /><span>{call.transcript.length} Q&A</span></div>
                        )}
                        {getQAScore(call) && (
                          <div className="flex items-center gap-1">
                            <Star className={`h-3 w-3 ${(getQAScore(call) || 0) >= 85 ? "text-emerald-500" : (getQAScore(call) || 0) >= 70 ? "text-amber-500" : "text-gray-400"}`} />
                            <span>{getQAScore(call)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    {call.aiSummary && (
                      <div className="mt-1.5 ml-13 pl-13 flex items-start gap-1.5">
                        <Brain className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-500 line-clamp-2">{call.aiSummary}</p>
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
