import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Phone, Calendar, Ban, Save, X, BookOpen, Sparkles, User, PawPrint } from "lucide-react";
import VoiceInputButton from "@/components/VoiceInputButton";
import LanguageSelect from "@/components/LanguageSelect";
import SummaryTab from "@/components/patients/SummaryTab";
import MedicalHistoryTab from "@/components/patients/MedicalHistoryTab";
import DocumentsTab from "@/components/patients/DocumentsTab";
import VitalsTab from "@/components/patients/VitalsTab";
import VisitsTab from "@/components/patients/VisitsTab";
import ReportsTab from "@/components/patients/ReportsTab";
import ClinicalTab from "@/components/patients/ClinicalTab";

export default function PatientDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("summary");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ questionnaire: "", scheduledAt: "", language: "" });
  const [condition, setCondition] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showBookingLink, setShowBookingLink] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [editingKb, setEditingKb] = useState(false);
  const [kbDraft, setKbDraft] = useState("");

  const { data: patientData } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data),
  });

  const { data: unifiedData } = useQuery({
    queryKey: ["patient-unified", id],
    queryFn: () => api.get(`/patients/${id}/unified`).then((r) => r.data),
  });

  const { data: questionnairesData } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: () => api.get("/questionnaires").then((r) => r.data),
  });

  const createCallMutation = useMutation({
    mutationFn: (data: any) => api.post("/calls", { patient: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-unified", id] });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      setShowSchedule(false);
      setGeneratedQuestions(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const doNotCallMutation = useMutation({
    mutationFn: (doNotCall: boolean) =>
      api.put(`/voice/${id}/do-not-call`, { doNotCall, reason: doNotCall ? "Marked by staff" : "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      toast.success("Do Not Call status updated");
    },
    onError: () => toast.error("Failed to update DNC status"),
  });

  const generateBookingLink = useMutation({
    mutationFn: ({ patientId, sendVia }: { patientId: string; sendVia: "sms" | "email" }) =>
      api.post("/patient-portal/generate-booking-link", { patientId, sendVia }).then((r) => r.data),
    onSuccess: (data) => {
      setShowBookingLink(false);
      toast.success(`Booking link sent! ${data.bookingLink ? "Link: " + data.bookingLink : ""}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to generate link"),
  });

  const updatePatientMutation = useMutation({
    mutationFn: (data: any) => api.put(`/patients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patient-unified", id] });
      setEditingKb(false);
      toast.success("Patient info updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const patient = patientData?.patient;
  const questionnaires = questionnairesData?.questionnaires || [];

  const recommendedQuestionnaires = questionnaires.filter((q: any) => {
    if (patient?.patientType === "pet" && q.targetProfession !== "veterinary" && q.targetSpecies !== "" && q.targetSpecies !== patient?.species) return false;
    const text = [patient?.medicalNotes, patient?.primaryDiagnosis, patient?.chronicConditions].filter(Boolean).join(" ").toLowerCase();
    if (!text) return false;
    const keywords = text.split(/[\s,;]+/).filter(Boolean);
    return keywords.some((kw: string) =>
      kw.length > 2 && (q.title.toLowerCase().includes(kw) || q.category.toLowerCase().includes(kw) || q.questions?.some((qt: any) => qt.text.toLowerCase().includes(kw)))
    );
  });

  const generateAndSchedule = async () => {
    if (!condition) return;
    setGenerating(true);
    try {
      const { data } = await api.post("/questionnaires/generate", { condition, language: scheduleForm.language || patient?.language || "en" });
      setGeneratedQuestions(data.questions);
    } catch (err) {
      toast.error("Failed to generate questions. Ensure API key is configured.");
    } finally {
      setGenerating(false);
    }
  };

  if (!patient) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${patient.patientType === "pet" ? "bg-amber-100 text-amber-600" : "bg-primary-light text-primary"}`}>
            {patient.patientType === "pet" ? <PawPrint className="h-8 w-8" /> : patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{patient.name}</h1>
              {patient.patientType === "pet" && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pet</span>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {patient.patientType === "pet"
                ? `${patient.ownerName ? `Owner: ${patient.ownerName}` : ""}${patient.ownerPhone ? ` · ${patient.ownerPhone}` : ""}`
                : `${patient.phone || ""}${patient.email ? ` · ${patient.email}` : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={patient.doNotCall ? "destructive" : "outline"} size="sm" onClick={() => doNotCallMutation.mutate(!patient.doNotCall)} disabled={doNotCallMutation.isPending}>
            <Ban className="mr-2 h-4 w-4" /> {patient.doNotCall ? "Unblock Calls" : "Do Not Call"}
          </Button>
          <Button onClick={() => { setShowSchedule(!showSchedule); setScheduleForm({ ...scheduleForm, language: patient.language }); }}>
            <Phone className="mr-2 h-4 w-4" /> {showSchedule ? "Close" : "Call Patient"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBookingLink(true)}>
            <Calendar className="mr-2 h-4 w-4" /> Send Booking Link
          </Button>
        </div>
      </div>

      {showBookingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBookingLink(false)}>
          <div className="max-w-sm w-full mx-4 rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Send Booking Link</h3>
            <p className="text-sm text-gray-500 mb-4">Patient will pick an available time slot and book themselves.</p>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" disabled={sendingLink || !patient.phone}
                onClick={() => { setSendingLink(true); generateBookingLink.mutate({ patientId: id!, sendVia: "sms" }, { onSettled: () => setSendingLink(false) }); }}>
                <Phone className="h-4 w-4" /> SMS
              </Button>
              <Button className="flex-1 gap-2" variant="outline" disabled={sendingLink || !patient.email}
                onClick={() => { setSendingLink(true); generateBookingLink.mutate({ patientId: id!, sendVia: "email" }, { onSettled: () => setSendingLink(false) }); }}>
                <Calendar className="h-4 w-4" /> Email
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-3">Link expires in 7 days.</p>
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowBookingLink(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {showSchedule && (
        <Card className="border-primary/20">
          <CardHeader className="bg-primary-light rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule a Call for {patient.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Questionnaire</label>
                <select value={scheduleForm.questionnaire} onChange={(e) => setScheduleForm({ ...scheduleForm, questionnaire: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Choose questionnaire...</option>
                  {questionnaires.map((q: any) => (
                    <option key={q._id} value={q._id}>{q.title} ({q.language?.toUpperCase()}){recommendedQuestionnaires.includes(q) ? " ★ Recommended" : ""}</option>
                  ))}
                </select>
                {recommendedQuestionnaires.length > 0 && (
                  <p className="mt-1 text-xs text-primary">★ {recommendedQuestionnaires.length} questionnaire(s) recommended based on medical notes</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Language</label>
                <LanguageSelect value={scheduleForm.language} onChange={(v) => setScheduleForm({ ...scheduleForm, language: v })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Schedule for later (optional)</label>
              <Input type="datetime-local" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })} />
            </div>
            <div className="rounded-lg border border-dashed p-4">
              <label className="mb-2 block text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                AI-Generate Custom Questions
              </label>
              <div className="flex gap-2">
                <Input value={condition} onChange={(e) => setCondition(e.target.value)}
                  placeholder={patient.medicalNotes ? `e.g., ${patient.medicalNotes.slice(0, 60)}...` : "e.g., Diabetes follow-up, Wound check..."} />
                <Button onClick={generateAndSchedule} disabled={generating || !condition} variant="secondary">
                  {generating ? "Generating..." : "Generate"}
                </Button>
              </div>
              {generatedQuestions && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium mb-2">Generated Questions ({generatedQuestions.length})</p>
                  {generatedQuestions.map((q: any, i: number) => (
                    <p key={i} className="text-sm text-gray-600 py-0.5">{i + 1}. {q.text} <span className="text-xs text-gray-400">({q.type})</span></p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { const payload: any = { ...scheduleForm }; if (scheduleForm.scheduledAt) payload.scheduledAt = scheduleForm.scheduledAt; createCallMutation.mutate(payload); }}
                disabled={createCallMutation.isPending}>
                {createCallMutation.isPending ? "Scheduling..." : scheduleForm.scheduledAt ? "Schedule Call" : "Call Now"}
              </Button>
              {generatedQuestions && generatedQuestions.length > 0 && (
                <Button variant="outline" onClick={async () => {
                  const { data: qData } = await api.post("/questionnaires", {
                    title: `${condition} Assessment - ${patient.name}`, questions: generatedQuestions,
                    language: scheduleForm.language || patient.language || "en", category: "custom",
                  });
                  setScheduleForm({ ...scheduleForm, questionnaire: qData.questionnaire._id });
                  setGeneratedQuestions(null);
                }}>
                  Save as Questionnaire & Use
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="reports">AI Reports</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab patient={patient} />
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 flex items-center gap-1"><BookOpen className="h-3 w-3" /> AI Knowledge Base Notes</span>
                {!editingKb && (
                  <button onClick={() => { setKbDraft(patient.kbNotes || ""); setEditingKb(true); }}
                    className="text-xs text-primary hover:underline">Edit</button>
                )}
              </div>
              {editingKb ? (
                <div className="space-y-2">
                  <div className="relative">
                    <textarea value={kbDraft} onChange={(e) => setKbDraft(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      placeholder="e.g., Patient prefers afternoon calls, hard of hearing..." />
                    <div className="absolute bottom-2 right-2">
                      <VoiceInputButton onResult={(text) => setKbDraft(kbDraft + text)} size="sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updatePatientMutation.mutate({ kbNotes: kbDraft })} disabled={updatePatientMutation.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingKb(false)}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm bg-gray-50 rounded-lg p-3 mt-1">{patient.kbNotes || <span className="text-gray-400 italic">No knowledge base notes.</span>}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <MedicalHistoryTab patientId={id!} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab patientId={id!} />
        </TabsContent>

        <TabsContent value="vitals">
          <VitalsTab patientId={id!} />
        </TabsContent>

        <TabsContent value="visits">
          <VisitsTab patientId={id!} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab patientId={id!} />
        </TabsContent>
        <TabsContent value="clinical">
          <ClinicalTab patientId={id!} specialty={patient?.specialty} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
