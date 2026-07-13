import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Phone, Play, FileText, Download, Calendar, Sparkles, Clock, Droplets, AlertTriangle, Pill, Bone, Stethoscope, HeartPulse, Syringe, User, Shield, MapPin, PhoneCall, Ban, BookOpen, Save, X, Mic, PawPrint, Weight } from "lucide-react";
import VoiceInputButton from "@/components/VoiceInputButton";
import LanguageSelect from "@/components/LanguageSelect";
import { formatDateTime } from "@/lib/utils";

export default function PatientDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ questionnaire: "", scheduledAt: "", language: "" });
  const [condition, setCondition] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: patientData } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data),
  });
  const { data: callsData } = useQuery({
    queryKey: ["patient-calls", id],
    queryFn: () => api.get(`/calls/patient/${id}/history`).then((r) => r.data),
  });
  const { data: questionnairesData } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: () => api.get("/questionnaires").then((r) => r.data),
  });

  const createCallMutation = useMutation({
    mutationFn: (data: any) => api.post("/calls", { patient: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-calls", id] });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      setShowSchedule(false);
      setGeneratedQuestions(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
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

  const [showBookingLink, setShowBookingLink] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  const generateBookingLink = useMutation({
    mutationFn: ({ patientId, sendVia }: { patientId: string; sendVia: "sms" | "email" }) =>
      api.post("/patient-portal/generate-booking-link", { patientId, sendVia }).then((r) => r.data),
    onSuccess: (data) => {
      setShowBookingLink(false);
      toast.success(`Booking link sent! ${data.bookingLink ? "Link: " + data.bookingLink : ""}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to generate link"),
  });

  const [editingKb, setEditingKb] = useState(false);
  const [kbDraft, setKbDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const updatePatientMutation = useMutation({
    mutationFn: (data: any) => api.put(`/patients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      setEditingKb(false);
      setEditing(false);
      toast.success("Patient info updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const startEditing = () => {
    const p = patientData?.patient;
    if (!p) return;
    const isPet = p.patientType === "pet";
    setEditForm({
      language: p.language || "en",
      gender: p.gender || "",
      bloodType: p.bloodType || "",
      dob: p.dob ? p.dob.split("T")[0] : "",
      insuranceId: p.insuranceId || "",
      address: p.address || "",
      primaryDiagnosis: p.primaryDiagnosis || "",
      chronicConditions: p.chronicConditions || "",
      allergies: p.allergies || "",
      currentMedications: p.currentMedications || "",
      pastSurgeries: p.pastSurgeries || "",
      emergencyContact: p.emergencyContact || "",
      emergencyContactPhone: p.emergencyContactPhone || "",
      medicalNotes: p.medicalNotes || "",
      ...(isPet ? {
        species: p.species || "",
        breed: p.breed || "",
        weight: p.weight || "",
        color: p.color || "",
        microchipId: p.microchipId || "",
        ownerName: p.ownerName || "",
        ownerPhone: p.ownerPhone || "",
        ownerEmail: p.ownerEmail || "",
      } : {}),
    });
    setEditing(true);
  };

  const patient = patientData?.patient;
  const calls = callsData?.calls || [];
  const questionnaires = questionnairesData?.questionnaires || [];

  const recommendedQuestionnaires = questionnaires.filter((q: any) => {
    if (patient?.patientType === "pet" && q.targetProfession !== "veterinary" && q.targetSpecies !== "" && q.targetSpecies !== patient?.species) return false;
    const text = [
      patient?.medicalNotes,
      patient?.primaryDiagnosis,
      patient?.chronicConditions,
    ].filter(Boolean).join(" ").toLowerCase();
    if (!text) return false;
    const keywords = text.split(/[\s,;]+/).filter(Boolean);
    return keywords.some((kw: string) =>
      kw.length > 2 && (
        q.title.toLowerCase().includes(kw) ||
        q.category.toLowerCase().includes(kw) ||
        q.questions?.some((qt: any) => qt.text.toLowerCase().includes(kw))
      )
    );
  });

  const generateAndSchedule = async () => {
    if (!condition) return;
    setGenerating(true);
    try {
      const { data } = await api.post("/questionnaires/generate", {
        condition,
        language: scheduleForm.language || patient?.language || "en",
      });
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
      <div className="flex items-center justify-between">
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
              <p className="text-gray-500">
                {patient.patientType === "pet"
                  ? `${patient.ownerName ? `Owner: ${patient.ownerName}` : ""}${patient.ownerPhone ? ` · ${patient.ownerPhone}` : ""}`
                  : `${patient.phone || ""}${patient.email ? ` · ${patient.email}` : ""}`}
              </p>
            </div>
          </div>
        <div className="flex items-center gap-2">
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
            <p className="text-xs text-gray-400 mt-3">Link expires in 7 days. Patient needs a phone ({patient.phone ? "✓" : "✗"}) or email ({patient.email ? "✓" : "✗"}) on file.</p>
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
                <select
                  value={scheduleForm.questionnaire}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, questionnaire: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Choose questionnaire...</option>
                  {questionnaires.map((q: any) => (
                    <option key={q._id} value={q._id}>
                      {q.title} ({q.language?.toUpperCase()})
                      {recommendedQuestionnaires.includes(q) ? " ★ Recommended" : ""}
                    </option>
                  ))}
                </select>
                {recommendedQuestionnaires.length > 0 && (
                  <p className="mt-1 text-xs text-primary">
                    ★ {recommendedQuestionnaires.length} questionnaire(s) recommended based on medical notes
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Language</label>
                <LanguageSelect
                  value={scheduleForm.language}
                  onChange={(v) => setScheduleForm({ ...scheduleForm, language: v })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Schedule for later (optional)</label>
              <Input
                type="datetime-local"
                value={scheduleForm.scheduledAt}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
              />
            </div>

            <div className="rounded-lg border border-dashed p-4">
              <label className="mb-2 block text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                AI-Generate Custom Questions Based on Patient Condition
              </label>
              <div className="flex gap-2">
                <Input
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder={patient.medicalNotes ? `e.g., ${patient.medicalNotes.slice(0, 60)}...` : "e.g., Diabetes follow-up, Wound check..."}
                />
                <Button onClick={generateAndSchedule} disabled={generating || !condition} variant="secondary">
                  {generating ? "Generating..." : "Generate"}
                </Button>
              </div>
              {generatedQuestions && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium mb-2">Generated Questions ({generatedQuestions.length})</p>
                  {generatedQuestions.map((q: any, i: number) => (
                    <p key={i} className="text-sm text-gray-600 py-0.5">
                      {i + 1}. {q.text}
                      <span className="text-xs text-gray-400 ml-1">({q.type})</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const payload: any = { ...scheduleForm };
                  if (scheduleForm.scheduledAt) payload.scheduledAt = scheduleForm.scheduledAt;
                  createCallMutation.mutate(payload);
                }}
                disabled={createCallMutation.isPending}
              >
                {createCallMutation.isPending ? "Scheduling..." :
                 scheduleForm.scheduledAt ? "Schedule Call" : "Call Now"}
              </Button>
              {generatedQuestions && generatedQuestions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const { data: qData } = await api.post("/questionnaires", {
                      title: `${condition} Assessment - ${patient.name}`,
                      questions: generatedQuestions,
                      language: scheduleForm.language || patient.language || "en",
                      category: "custom",
                    });
                    setScheduleForm({ ...scheduleForm, questionnaire: qData.questionnaire._id });
                    setGeneratedQuestions(null);
                  }}
                >
                  Save as Questionnaire & Use
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Patient Info</CardTitle>
              {!editing && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Edit All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Language</label>
                    <LanguageSelect value={editForm.language} onChange={(v) => setEditForm({ ...editForm, language: v })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Gender</label>
                    <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm">
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Blood Type</label>
                    <select value={editForm.bloodType} onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                      className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm">
                      <option value="">—</option>
                      <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">DOB</label>
                    <Input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Address</label>
                    <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Insurance ID</label>
                    <Input value={editForm.insuranceId} onChange={(e) => setEditForm({ ...editForm, insuranceId: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Assigned Doctor</label>
                    <span className="text-sm font-medium block pt-1.5">{patient.assignedDoctor?.name || "—"}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><Stethoscope className="h-4 w-4 text-primary" /> Medical Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Primary Diagnosis</label>
                      <Input value={editForm.primaryDiagnosis} onChange={(e) => setEditForm({ ...editForm, primaryDiagnosis: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Chronic Conditions</label>
                      <Input value={editForm.chronicConditions} onChange={(e) => setEditForm({ ...editForm, chronicConditions: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Allergies</label>
                      <Input value={editForm.allergies} onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Current Medications</label>
                      <Input value={editForm.currentMedications} onChange={(e) => setEditForm({ ...editForm, currentMedications: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Past Surgeries</label>
                      <Input value={editForm.pastSurgeries} onChange={(e) => setEditForm({ ...editForm, pastSurgeries: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Additional Medical Notes</label>
                      <div className="relative">
                        <textarea value={editForm.medicalNotes} onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
                          className="flex min-h-[60px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                        <div className="absolute bottom-2 right-2">
                          <VoiceInputButton onResult={(text) => setEditForm({ ...editForm, medicalNotes: editForm.medicalNotes + text })} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><PhoneCall className="h-4 w-4 text-primary" /> Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Name</label>
                      <Input value={editForm.emergencyContact} onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Phone</label>
                      <Input value={editForm.emergencyContactPhone} onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} className="h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => updatePatientMutation.mutate(editForm)} disabled={updatePatientMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" /> {updatePatientMutation.isPending ? "Saving..." : "Save All Changes"}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                {patient.patientType === "pet" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <div><span className="text-gray-500 block">Species</span><span className="font-medium">{patient.species || "—"}</span></div>
                    <div><span className="text-gray-500 block">Breed</span><span className="font-medium">{patient.breed || "—"}</span></div>
                    <div><span className="text-gray-500 block">Weight</span><span className="font-medium">{patient.weight ? `${patient.weight} kg` : "—"}</span></div>
                    <div><span className="text-gray-500 block">Color</span><span className="font-medium">{patient.color || "—"}</span></div>
                    <div><span className="text-gray-500 block">Microchip ID</span><span className="font-medium">{patient.microchipId || "—"}</span></div>
                    <div><span className="text-gray-500 block">Gender</span><span className="font-medium capitalize">{patient.gender || "—"}</span></div>
                    <div><span className="text-gray-500 block">Assigned Vet</span><span className="font-medium">{patient.assignedDoctor?.name || "—"}</span></div>
                    <div><span className="text-gray-500 block">Last Checkup</span><span className="font-medium">{patient.lastCheckupDate ? new Date(patient.lastCheckupDate).toLocaleDateString() : "—"}</span></div>
                    <div><span className="text-gray-500 block">Next Scheduled</span><span className="font-medium">{patient.nextScheduledDate ? new Date(patient.nextScheduledDate).toLocaleDateString() : "—"}</span></div>
                    <div className="col-span-full border-t pt-2 mt-2">
                      <span className="text-gray-500 block text-xs font-medium mb-2">Owner Information</span>
                    </div>
                    <div><span className="text-gray-500 block">Owner Name</span><span className="font-medium">{patient.ownerName || "—"}</span></div>
                    <div><span className="text-gray-500 block">Owner Phone</span><span className="font-medium">{patient.ownerPhone || "—"}</span></div>
                    <div><span className="text-gray-500 block">Owner Email</span><span className="font-medium">{patient.ownerEmail || "—"}</span></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <div><span className="text-gray-500 block">Language</span><span className="font-medium uppercase">{patient.language}</span></div>
                    <div><span className="text-gray-500 block">Gender</span><span className="font-medium capitalize">{patient.gender || "—"}</span></div>
                    <div><span className="text-gray-500 block">Blood Type</span><span className="font-medium">{patient.bloodType ? <span className="text-red-600">{patient.bloodType}</span> : "—"}</span></div>
                    <div><span className="text-gray-500 block">DOB</span><span className="font-medium">{patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"}</span></div>
                    <div><span className="text-gray-500 block">Assigned Doctor</span><span className="font-medium">{patient.assignedDoctor?.name || "—"}</span></div>
                    <div><span className="text-gray-500 block">Insurance ID</span><span className="font-medium">{patient.insuranceId || "—"}</span></div>
                    <div className="col-span-full"><span className="text-gray-500 block">Address</span><span className="font-medium">{patient.address || "—"}</span></div>
                    <div><span className="text-gray-500 block">Last Checkup</span><span className="font-medium">{patient.lastCheckupDate ? new Date(patient.lastCheckupDate).toLocaleDateString() : "—"}</span></div>
                    <div><span className="text-gray-500 block">Next Scheduled</span><span className="font-medium">{patient.nextScheduledDate ? new Date(patient.nextScheduledDate).toLocaleDateString() : "—"}</span></div>
                  </div>
                )}

                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><Stethoscope className="h-4 w-4 text-primary" /> Medical Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: HeartPulse, label: "Primary Diagnosis", value: patient.primaryDiagnosis, color: "text-blue-600" },
                      { icon: AlertTriangle, label: "Chronic Conditions", value: patient.chronicConditions, color: "text-amber-600" },
                      { icon: Droplets, label: "Allergies", value: patient.allergies, color: "text-red-600" },
                      { icon: Pill, label: "Current Medications", value: patient.currentMedications, color: "text-purple-600" },
                      { icon: Syringe, label: "Past Surgeries", value: patient.pastSurgeries, color: "text-cyan-600" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs flex items-center gap-1 mb-0.5"><item.icon className={`h-3 w-3 ${item.color}`} /> {item.label}</p>
                        <p className="text-sm font-medium">{item.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><PhoneCall className="h-4 w-4 text-primary" /> Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-xs text-gray-500">Name</span><p className="text-sm font-medium">{patient.emergencyContact || "—"}</p></div>
                    <div><span className="text-xs text-gray-500">Phone</span><p className="text-sm font-medium">{patient.emergencyContactPhone || "—"}</p></div>
                  </div>
                </div>

                {patient.medicalNotes && (
                  <div className="border-t pt-3">
                    <span className="text-xs text-gray-500">Additional Medical Notes</span>
                    <p className="text-sm bg-gray-50 rounded-lg p-3 mt-1">{patient.medicalNotes}</p>
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 flex items-center gap-1"><BookOpen className="h-3 w-3" /> AI Knowledge Base Notes</span>
                {!editingKb && !editing && (
                  <button onClick={() => { setKbDraft(patient.kbNotes || ""); setEditingKb(true); }}
                    className="text-xs text-primary hover:underline">Edit</button>
                )}
              </div>
              {editingKb ? (
                <div className="space-y-2">
                  <div className="relative">
                    <textarea value={kbDraft} onChange={(e) => setKbDraft(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="e.g., Patient prefers afternoon calls, hard of hearing, family should be notified for critical updates..." />
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
                <p className="text-sm bg-gray-50 rounded-lg p-3 mt-1">{patient.kbNotes || <span className="text-gray-400 italic">No knowledge base notes. These help the AI agent understand patient context during calls.</span>}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Call History ({calls.length})</CardTitle></CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <p className="text-sm text-gray-500">No calls recorded yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {calls.map((call: any) => (
                  <Link
                    key={call._id}
                    to={`/calls/${call._id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        call.status === "completed" ? "bg-green-100 text-green-600" :
                        call.status === "failed" ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        {call.status === "completed" ? <Play className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{call.status}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(call.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.aiSeverityScore && (
                        <span className={`text-xs font-medium ${
                          call.aiSeverityScore >= 7 ? "text-red-600" :
                          call.aiSeverityScore >= 4 ? "text-amber-500" : "text-green-600"
                        }`}>
                          {call.aiSeverityScore}/10
                        </span>
                      )}
                      {call.audioUrl && <Download className="h-4 w-4 text-gray-400" />}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {calls.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Call Details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calls.map((call: any) => (
                <div key={call._id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{call.status} Call</span>
                      {call.questionnaire?.title && (
                        <span className="text-xs text-gray-400">· {call.questionnaire.title}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDateTime(call.createdAt)}</span>
                  </div>
                  {call.transcript && call.transcript.length > 0 && (
                    <div className="space-y-1">
                      {call.transcript.slice(0, 3).map((entry: any, i: number) => (
                        <p key={i} className="text-sm text-gray-600">
                          <span className="font-medium">Q:</span> {entry.question}
                          <br />
                          <span className="font-medium">A:</span> {entry.answer}
                        </p>
                      ))}
                      {call.transcript.length > 3 && (
                        <a href={`/calls/${call._id}`} className="text-sm text-primary hover:underline">
                          View full transcript →
                        </a>
                      )}
                    </div>
                  )}
                  {call.aiSummary && (
                    <div className="mt-2 rounded bg-primary-light p-2">
                      <p className="text-xs font-medium text-primary">AI Summary</p>
                      <p className="text-sm text-gray-700">{call.aiSummary}</p>
                    </div>
                  )}
                  {call.audioUrl && (
                    <audio controls className="mt-2 w-full h-8">
                      <source src={call.audioUrl} type="audio/mpeg" />
                    </audio>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
