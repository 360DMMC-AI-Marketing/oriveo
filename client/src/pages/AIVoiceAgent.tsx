import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import VoiceAgent from "@/components/VoiceAgent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Phone, Bot, Headphones, Settings2, Activity, Globe, ClipboardList, ChevronDown, ChevronUp, X } from "lucide-react";
import { medicalTemplates } from "@/data/medicalTemplates";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
];

export default function AIVoiceAgent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callLanguage, setCallLanguage] = useState("en");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedQId, setSelectedQId] = useState("");
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);

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

  const patients = patientsData?.patients || [];
  const activeCalls = callsData?.calls || [];
  const savedQuestionnaires = questionnairesData?.questionnaires || [];

  // Handle URL params (e.g. from Appointments "Call" button)
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    const patientName = searchParams.get("patientName");
    if (patientId && patientName) {
      const patient = patients.find((p: any) => p._id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setSearch(patient.name);
        startOutboundCall(patient);
      } else {
        setSearch(patientName);
      }
      // Clean URL params
      setSearchParams({}, { replace: true });
    }
  }, [patients, searchParams]);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Center</h1>
          <p className="text-muted-foreground text-sm">Quick-call patients or launch AI-powered conversations</p>
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
            <Settings2 className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTestPanel(!showTestPanel)}>
            {showTestPanel ? "Hide Test" : "Test Agent"}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Active Calls</CardTitle>
            <Phone className="h-3.5 w-3.5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{activeCalls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Patients</CardTitle>
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Status</CardTitle>
            <Bot className="h-3.5 w-3.5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Voice</CardTitle>
            <Headphones className="h-3.5 w-3.5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">ElevenLabs</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick-call widget - always visible */}
      <Card className="border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-3">
            {/* Patient search */}
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

            {/* Template / Questionnaire picker */}
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

            {/* Language + Call button */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">&nbsp;</label>
              <Button onClick={handleQuickCall} disabled={!selectedPatient}
                className="h-10 gap-2 px-6">
                <Phone className="h-4 w-4" />
                Call Now
              </Button>
            </div>
          </div>

          {/* Selected patient info */}
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

          {/* Questions preview */}
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

      {/* Active call status (if call is in progress) */}
      {activeCallId && selectedPatient && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="py-3 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium">Active call with {selectedPatient.name}</span>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setActiveCallId(null); }}>
              End Call
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active calls from server */}
      {activeCalls.length > 0 && !activeCallId && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Active Calls on Server</CardTitle>
          </CardHeader>
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

      {/* Test panel - collapsible */}
      {showTestPanel && (
        <Card>
          <CardHeader className="pb-2 pt-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Browser Voice Test</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTestPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pb-3">
            <VoiceAgent
              language={callLanguage}
              questions={selectedQuestions}
              onCallEnd={() => setActiveCallId(null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
