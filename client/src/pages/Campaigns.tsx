import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Phone, Play, Pause, CheckCircle2, XCircle,
  Clock, TrendingUp, Upload, Calendar, Users, Megaphone,
  Plus, ClipboardList, ChevronDown, ChevronUp, Globe,
  Stethoscope, Bell, RefreshCw, MessageSquare,
} from "lucide-react";
import { medicalTemplates } from "@/data/medicalTemplates";

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("");

  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
  });
  const { data: questionnairesData } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: () => api.get("/questionnaires").then((r) => r.data),
  });
  const { data: callsData } = useQuery({
    queryKey: ["calls"],
    queryFn: () => api.get("/calls").then((r) => r.data),
  });
  const { data: campaignsData } = useQuery({
    queryKey: ["batch-campaigns"],
    queryFn: () => api.get("/batch/campaigns").then((r) => r.data),
  });

  const patients = patientsData?.patients || [];
  const questionnaires = questionnairesData?.questionnaires || [];
  const calls = callsData?.calls || [];
  const batchCampaigns = campaignsData?.campaigns || [];

  const startCampaignMutation = useMutation({
    mutationFn: (data: any) => api.post("/batch/start", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-campaigns"] });
      toast.success("Campaign launched");
      setShowNewCampaign(false);
      setCampaignName("");
      setScheduleDate("");
      setScheduleTime("");
      setSelectedQuestionnaire("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Campaign failed"),
  });

  const handleLaunchCampaign = () => {
    if (!campaignName.trim()) { toast.error("Campaign name required"); return; }
    const patientIds = patients.map((p: any) => p._id);
    const scheduledAt = scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : undefined;
    const payload: any = { name: campaignName, patientIds, scheduledAt };
    if (selectedQuestionnaire && !selectedQuestionnaire.startsWith("template_")) {
      payload.questionnaireId = selectedQuestionnaire;
    }
    startCampaignMutation.mutate(payload);
  };

  const inProgress = calls.filter((c: any) => c.status === "in-progress");
  const scheduled = calls.filter((c: any) => c.status === "scheduled");
  const completed = calls.filter((c: any) => c.status === "completed");
  const failed = calls.filter((c: any) => c.status === "failed");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground text-sm">Batch call campaigns to patient groups</p>
        </div>
        <Button onClick={() => setShowNewCampaign(!showNewCampaign)} className="gap-2">
          {showNewCampaign ? <ChevronUp className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {showNewCampaign ? "Cancel" : "New Campaign"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Active</CardTitle>
            <Phone className="h-3.5 w-3.5 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{inProgress.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Scheduled</CardTitle>
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{scheduled.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{completed.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Failed</CardTitle>
            <XCircle className="h-3.5 w-3.5 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{failed.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Campaigns</CardTitle>
            <Megaphone className="h-3.5 w-3.5 text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-xl font-bold">{batchCampaigns.length}</div></CardContent>
        </Card>
      </div>

      {/* New campaign form */}
      {showNewCampaign && (
        <Card>
          <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm">New Batch Campaign</CardTitle></CardHeader>
          <CardContent className="pb-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Campaign Name</Label>
                <Input placeholder="e.g., Weekly Checkup" value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Questionnaire</Label>
                <select value={selectedQuestionnaire} onChange={(e) => setSelectedQuestionnaire(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">None</option>
                  <optgroup label="Medical Templates">
                    {medicalTemplates.map((t) => (
                      <option key={t.id} value={`template_${t.id}`}>{t.condition}</option>
                    ))}
                  </optgroup>
                  {questionnaires.length > 0 && (
                    <optgroup label="Saved Questionnaires">
                      {questionnaires.map((q: any) => (
                        <option key={q._id} value={q._id}>{q.title}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Will call <strong>{patients.length} patients</strong>
                {scheduleDate ? ` on ${scheduleDate}` : " immediately"}.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowNewCampaign(false)}>Cancel</Button>
                <Button size="sm" onClick={handleLaunchCampaign} disabled={startCampaignMutation.isPending}>
                  {startCampaignMutation.isPending ? "Launching..." : "Launch Campaign"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automated Patient Calls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Automated Patient Calls
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowNewCampaign(false)}>
            <RefreshCw className="h-3.5 w-3.5" /> View History
          </Button>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-gray-400 mb-3">Schedule automated follow-up, reminder, or check-in calls for your patients.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              { type: "follow_up", label: "Follow-up", icon: RefreshCw, color: "text-blue-600 bg-blue-50" },
              { type: "appointment_reminder", label: "Appt Reminder", icon: Calendar, color: "text-purple-600 bg-purple-50" },
              { type: "medication_reminder", label: "Medication", icon: Bell, color: "text-amber-600 bg-amber-50" },
              { type: "post_discharge", label: "Post-discharge", icon: Stethoscope, color: "text-emerald-600 bg-emerald-50" },
            ] as const).map(({ type, label, icon: Icon, color }) => (
              <button key={type}
                onClick={async () => {
                  const patients = patientsData?.patients || [];
                  if (patients.length === 0) {
                    toast.error("No patients available");
                    return;
                  }
                  const patientId = prompt("Enter patient ID for " + label + " call:");
                  if (!patientId) return;
                  try {
                    await api.post("/automation/schedule", { patientId, type });
                    toast.success(`${label} call scheduled`);
                    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
                  } catch (e: any) {
                    toast.error(e.response?.data?.message || "Failed to schedule");
                  }
                }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 hover:shadow-md hover:scale-[1.02] transition-all ${color}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign History */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm">Campaign History</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          {batchCampaigns.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Megaphone className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
              <p className="text-xs text-gray-400">Launch a batch campaign above</p>
            </div>
          ) : (
            <div className="space-y-1">
              {batchCampaigns.map((camp: any) => (
                <div key={camp.id} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{camp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {camp.totalPatients} patients · {camp.completedCalls} completed
                      {camp.scheduledAt && ` · ${new Date(camp.scheduledAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    camp.status === "running" ? "bg-emerald-100 text-emerald-800" :
                    camp.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                    camp.status === "completed" ? "bg-green-100 text-green-800" :
                    camp.status === "paused" ? "bg-amber-100 text-amber-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>{camp.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent call activity from campaigns */}
      {(scheduled.length > 0 || inProgress.length > 0) && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Upcoming / Active Campaign Calls</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 space-y-1">
            {[...scheduled, ...inProgress].slice(0, 10).map((call: any) => (
              <div key={call._id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{call.patient?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {call.scheduledAt ? new Date(call.scheduledAt).toLocaleString() : "Immediate"}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                  call.status === "in-progress" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                }`}>{call.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
