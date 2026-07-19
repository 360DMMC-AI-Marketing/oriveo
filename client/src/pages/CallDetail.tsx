import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LiveNotePanel from "@/components/ambient/LiveNotePanel";
import { useLiveNote } from "@/hooks/useLiveNote";
import {
  ArrowLeft, Download, Phone, AlertTriangle, CheckCircle, XCircle,
  Clock, Mic, Brain, FileText, RotateCcw, Lightbulb, Activity,
  Volume2, ThumbsUp, ThumbsDown, BarChart3, User, Calendar, PhoneCall,
  Siren, ShieldAlert, Headphones
} from "lucide-react";

export default function CallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["call", id],
    queryFn: () => api.get(`/calls/${id}`).then((r) => r.data),
  });

  const recallMutation = useMutation({
    mutationFn: () => api.post(`/calls/${id}/recall`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call", id] });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  const emergencyMutation = useMutation({
    mutationFn: ({ target }: { target: "911" | "clinic" }) =>
      api.post(`/calls/${id}/emergency/call`, { target }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["call", id] });
      toast.success(res.data.message);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Emergency call failed"),
  });

  const transferMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/calls/${id}/transfer`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call", id] });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      setShowTransferModal(false);
      toast.success("Call transferred to human operator");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Transfer failed"),
  });

  const [confirmEmergency, setConfirmEmergency] = useState<"911" | "clinic" | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferReason, setTransferReason] = useState("");

  const { note: liveNote, isFinal: noteIsFinal, isLive: noteIsLive, lastUpdate } = useLiveNote(id);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!data?.call) return <p className="text-gray-500">Call not found</p>;

  const call = data.call;
  const isUnanswered = call.status === "failed" || call.patientResponded === false;
  const isCompleted = call.status === "completed";
  const isScheduled = call.status === "scheduled";
  const isInProgress = call.status === "in-progress";
  const isTransferred = call.status === "transferred";
  const severity = call.aiSeverityScore;
  const hasTranscript = call.transcript && call.transcript.length > 0;

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="h-6 w-6 text-emerald-600" />;
    if (isUnanswered) return <XCircle className="h-6 w-6 text-red-600" />;
    if (isInProgress) return <Activity className="h-6 w-6 text-blue-600" />;
    if (isTransferred) return <Headphones className="h-6 w-6 text-blue-600" />;
    return <Clock className="h-6 w-6 text-amber-600" />;
  };

  const getResponseStatus = () => {
    if (call.patientResponded === true) return { label: "Patient Answered", color: "bg-emerald-100 text-emerald-800", icon: ThumbsUp };
    if (call.patientResponded === false) return { label: "No Answer", color: "bg-red-100 text-red-800", icon: ThumbsDown };
    if (isScheduled) return { label: "Scheduled", color: "bg-amber-100 text-amber-800", icon: Clock };
    if (isInProgress) return { label: "Calling...", color: "bg-blue-100 text-blue-800", icon: Activity };
    if (isTransferred) return { label: "Transferred to Human", color: "bg-blue-100 text-blue-800", icon: Headphones };
    if (call.status === "failed" && !call.patientResponded) return { label: "Call Failed / No Answer", color: "bg-red-100 text-red-800", icon: XCircle };
    return { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: Phone };
  };

  const responseStatus = getResponseStatus();
  const ResponseIcon = responseStatus.icon;

  const isEmergency = call.emergencyDetected || (call.redFlags?.some((f: any) => f.tier === 0)) || (severity >= 7);
  const isDoctor = user?.role === "admin" || user?.role === "doctor";
  const emergencyActionTaken = call.emergencyActionTaken;
  const emergencyDone = emergencyActionTaken && emergencyActionTaken !== "none";
  const emergencyLabel = emergencyActionTaken === "called_911" ? "911 called"
    : emergencyActionTaken === "called_clinic" ? "Clinic called"
    : emergencyActionTaken === "both" ? "911 + Clinic called" : "Unknown";

  return (
    <div className="space-y-6">
      {isEmergency && (
        <Card className="border-red-400 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <Siren className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-800">Emergency Detected</h2>
                  <p className="text-sm text-red-700 mt-0.5">
                    {call.emergencyType === "crisis"
                      ? "Patient may be experiencing a mental health crisis. Immediate attention required."
                      : "Patient symptoms indicate a potential medical emergency. Immediate action recommended."}
                  </p>
                  {call.redFlags && call.redFlags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {call.redFlags.map((f: any, i: number) => (
                        <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          f.tier === 0 ? "text-red-700 bg-red-100 ring-red-600/30" : "text-amber-700 bg-amber-50 ring-amber-600/20"
                        }`}>
                          <ShieldAlert className="h-3 w-3" />
                          {f.keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  {emergencyDone && (
                    <p className="mt-2 text-sm font-medium text-red-800">
                      &#10003; Emergency action taken: {emergencyLabel} at {new Date(call.emergencyCalledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {!emergencyDone && (
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                    onClick={() => setConfirmEmergency("911")}
                    disabled={emergencyMutation.isPending}
                  >
                    <Phone className="h-4 w-4" />
                    Call 911
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 gap-1.5"
                    onClick={() => setConfirmEmergency("clinic")}
                    disabled={emergencyMutation.isPending}
                  >
                    <Phone className="h-4 w-4" />
                    Call Clinic
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTransferModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Headphones className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Transfer to Human Operator</h3>
                <p className="text-sm text-gray-500">This will transfer the call to {call.patient?.name || "the patient"}.</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for transfer</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g., Patient is requesting to speak with a doctor, Complex medical question..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTransferModal(false)}>Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => transferMutation.mutate(transferReason)}
                disabled={transferMutation.isPending}
              >
                {transferMutation.isPending ? "Transferring..." : "Transfer Call"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmEmergency(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Emergency Call</h3>
                <p className="text-sm text-gray-500">This will place an outbound call to {confirmEmergency === "911" ? "emergency services (911)" : "the clinic on-call number"}.</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-4">
              <p className="font-medium">Patient: {call.patient?.name || "Unknown"}</p>
              <p className="mt-0.5">Phone: {call.patient?.phone || "N/A"}</p>
              {call.redFlags?.length > 0 && (
                <p className="mt-1">Flags: {call.redFlags.map((f: any) => f.keyword).join(", ")}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmEmergency(null)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  emergencyMutation.mutate({ target: confirmEmergency });
                  setConfirmEmergency(null);
                }}
                disabled={emergencyMutation.isPending}
              >
                {emergencyMutation.isPending ? "Calling..." : `Call ${confirmEmergency === "911" ? "911" : "Clinic"}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/calendar" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Call Report</h1>
            <p className="text-gray-500">
              {call.patient?.name} &middot; {new Date(call.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {isUnanswered && (
          <Button
            onClick={() => recallMutation.mutate()}
            disabled={recallMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {recallMutation.isPending ? "Recalling..." : "Recall Patient"}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon()}
                  <span className="text-lg font-bold capitalize">{call.status}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Response</p>
            <div className="flex items-center gap-2 mt-1">
              <ResponseIcon className="h-5 w-5" />
              <span className="text-lg font-bold">{responseStatus.label}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
            <p className="text-lg font-bold mt-1">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Severity Score</p>
            {severity ? (
              <p className={`text-lg font-bold mt-1 ${
                severity >= 7 ? "text-red-600" :
                severity >= 4 ? "text-amber-600" :
                "text-emerald-600"
              }`}>{severity}/10</p>
            ) : <p className="text-lg font-bold mt-1 text-gray-300">—</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Patient</p>
              <p className="font-medium">{call.patient?.name || "Unknown"}</p>
              <p className="text-sm text-gray-500">{call.patient?.phone || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Language</p>
              <p className="font-medium">{(call.language || "en").toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>
        {call.detectedSpecialty && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Brain className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Detected Specialty</p>
                <p className="font-medium capitalize">{call.detectedSpecialty}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {(liveNote || (isInProgress && noteIsLive)) && (
        <LiveNotePanel
          note={liveNote}
          isLive={noteIsLive}
          isFinal={noteIsFinal}
          lastUpdate={lastUpdate}
          patientName={call.patient?.name}
          onSign={noteIsFinal ? () => toast.success("Clinical note signed") : undefined}
        />
      )}

      {(isCompleted || call.audioUrl) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Audio Recording
            </CardTitle>
            {call.audioUrl && (
              <a href={call.audioUrl} download
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 h-9">
                <Download className="h-4 w-4" /> Download
              </a>
            )}
          </CardHeader>
          <CardContent>
            {call.audioUrl ? (
              <audio controls className="w-full" src={call.audioUrl}>
                Your browser does not support the audio element.
              </audio>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Audio not available. API key may not be configured.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {hasTranscript && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Transcript
                </CardTitle>
                <span className="text-sm text-gray-500">{call.transcript.length} Q&A</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {call.transcript.map((entry: any, i: number) => (
                    <div key={i} className="rounded-lg border p-4">
                      <p className="text-sm flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary text-xs font-bold">Q</span>
                        <span className="font-medium text-gray-900">{entry.question}</span>
                      </p>
                      <p className="mt-2 text-sm flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-bold">A</span>
                        <span className={`${entry.answer ? "text-gray-700" : "text-gray-400 italic"}`}>
                          {entry.answer || "No response"}
                        </span>
                      </p>
                      {entry.timestamp > 0 && (
                        <p className="mt-1 text-xs text-gray-400 ml-8">{Math.floor(entry.timestamp / 60)}:{(entry.timestamp % 60).toString().padStart(2, "0")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {call.aiSummary ? (
                <div className="rounded-lg bg-primary-light p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Summary</p>
                  <p className="text-sm text-gray-600">{call.aiSummary}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-3">No AI summary available</p>
              )}

              {severity && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Severity Assessment</p>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      severity >= 7 ? "bg-red-100" :
                      severity >= 4 ? "bg-amber-100" :
                      "bg-emerald-100"
                    }`}>
                      <BarChart3 className={`h-6 w-6 ${
                        severity >= 7 ? "text-red-600" :
                        severity >= 4 ? "text-amber-600" :
                        "text-emerald-600"
                      }`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${
                        severity >= 7 ? "text-red-600" :
                        severity >= 4 ? "text-amber-600" :
                        "text-emerald-600"
                      }`}>{severity}/10</p>
                      <p className="text-xs text-gray-500">
                        {severity >= 7 ? "High risk — Needs immediate attention" :
                         severity >= 4 ? "Moderate risk — Monitor closely" :
                         "Low risk — Routine follow-up"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {call.recallCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-medium text-amber-800">Recalled {call.recallCount} time(s)</p>
                  <p className="text-amber-700">This patient has been re-contacted multiple times.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {call.aiRecommendations ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-800">{call.aiRecommendations}</p>
                </div>
              ) : severity && severity >= 5 ? (
                <div className="space-y-2">
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">Schedule follow-up appointment</span>
                  </div>
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">Notify attending physician</span>
                  </div>
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-gray-700">Schedule follow-up call in 48 hours</span>
                  </div>
                </div>
              ) : severity && severity >= 4 ? (
                <div className="space-y-2">
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <Activity className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">Monitor condition — schedule weekly checkup</span>
                  </div>
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-gray-700">Follow-up call in 1 week</span>
                  </div>
                </div>
              ) : isCompleted ? (
                <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Patient stable. No immediate action needed.</span>
                </div>
              ) : isUnanswered ? (
                <div className="space-y-2">
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-gray-700">Recall patient at a different time</span>
                  </div>
                  <div className="rounded-lg border p-3 text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">Try alternative contact number</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No recommendations yet</p>
              )}
            </CardContent>
          </Card>

          {isCompleted && call.aiSeverityScore != null && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Medical Coding Suggestion</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      {call.aiSeverityScore >= 8 ? "99285" :
                       call.aiSeverityScore >= 6 ? "99284" :
                       call.aiSeverityScore >= 4 ? "99283" :
                       "99282"}
                    </p>
                    <p className="text-xs text-gray-500">
                      CPT {call.aiSeverityScore >= 8 ? "Critical" :
                           call.aiSeverityScore >= 6 ? "High" :
                           call.aiSeverityScore >= 4 ? "Moderate" :
                           "Low"} severity visit
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          )}

          {isCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={`/patients/${call.patient?._id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" /> View Patient Profile
                  </Button>
                </Link>
                <Link to={`/patients/${call.patient?._id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" /> Schedule New Checkup
                  </Button>
                </Link>
                {call.audioUrl && (
                  <a href={call.audioUrl} download
                    className="inline-flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 h-10 cursor-pointer">
                    <Download className="h-4 w-4" /> Download Audio
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {isInProgress && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Headphones className="h-5 w-5" />
                  Live Call
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-blue-700">
                  This call is currently in progress. You can transfer it to a human operator if needed.
                </p>
                <Button
                  onClick={() => {
                    setTransferReason("");
                    setShowTransferModal(true);
                  }}
                  disabled={transferMutation.isPending}
                  className="w-full gap-2"
                >
                  <Headphones className="h-4 w-4" />
                  {transferMutation.isPending ? "Transferring..." : "Transfer to Human"}
                </Button>
              </CardContent>
            </Card>
          )}

          {isTransferred && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Headphones className="h-5 w-5" />
                  Transferred to Human
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-blue-700">
                  {call.transferReason
                    ? `Reason: ${call.transferReason}`
                    : "This call was transferred to a human operator."}
                </p>
              </CardContent>
            </Card>
          )}

          {isUnanswered && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Call Not Answered
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-amber-700">
                  The patient did not respond. Use the recall button above to try again, or schedule a new call at a different time.
                </p>
                <Link to={`/patients/${call.patient?._id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" /> Schedule New Call
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
