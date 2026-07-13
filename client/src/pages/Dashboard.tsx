import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Phone, AlertTriangle, CheckCircle, Clock,
  Activity, Brain, Users, Calendar, TrendingUp,
  ArrowRight, Mic, BarChart3, Siren, ShieldAlert, DollarSign
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmEmergency, setConfirmEmergency] = useState<{ callId: string; target: "911" | "clinic" } | null>(null);

  const { data: patientsData, isLoading: loadingPatients, isError: errorPatients } = useQuery({ queryKey: ["patients"], queryFn: () => api.get("/patients").then((r) => r.data) });
  const { data: callsData, isLoading: loadingCalls, isError: errorCalls } = useQuery({ queryKey: ["calls"], queryFn: () => api.get("/calls").then((r) => r.data) });
  const { data: questionnairesData, isLoading: loadingQuestionnaires, isError: errorQuestionnaires } = useQuery({ queryKey: ["questionnaires"], queryFn: () => api.get("/questionnaires").then((r) => r.data) });
  const { data: appointmentStats, isLoading: loadingApptStats, isError: errorApptStats } = useQuery({ queryKey: ["appointment-stats"], queryFn: () => api.get("/appointments/stats").then((r) => r.data) });

  const emergencyMutation = useMutation({
    mutationFn: ({ callId, target }: { callId: string; target: "911" | "clinic" }) =>
      api.post(`/calls/${callId}/emergency/call`, { target }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      toast.success(res.data.message);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Emergency call failed"),
  });

  const patients = patientsData?.patients || [];
  const calls = callsData?.calls || [];
  const questionnaires = questionnairesData?.questionnaires || [];

  const completedCalls = calls.filter((c: any) => c.status === "completed");
  const scheduledCalls = calls.filter((c: any) => c.status === "scheduled");
  const failedCalls = calls.filter((c: any) => c.status === "failed");
  const inProgressCalls = calls.filter((c: any) => c.status === "in-progress");

  const emergencyCalls = calls.filter((c: any) =>
    c.emergencyDetected ||
    c.redFlags?.some((f: any) => f.tier === 0) ||
    (c.aiSeverityScore >= 7 && c.emergencyActionTaken === "none")
  );

  const highSeverityCalls = completedCalls.filter((c: any) => c.aiSeverityScore >= 7);
  const mediumSeverityCalls = completedCalls.filter((c: any) => c.aiSeverityScore >= 4 && c.aiSeverityScore < 7);

  const todayCalls = calls.filter((c: any) => {
    const today = new Date();
    const callDate = new Date(c.createdAt);
    return callDate.toDateString() === today.toDateString();
  });

  const needsFollowUp = calls.filter((c: any) => {
    const aiSummary = c.aiSummary || "";
    return aiSummary.toLowerCase().includes("follow") || aiSummary.toLowerCase().includes("urgent") || (c.aiSeverityScore || 0) >= 5;
  });

  const recentCompleted = [...completedCalls]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingScheduled = [...scheduledCalls]
    .sort((a: any, b: any) => new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Dashboard</h1>
          <p className="text-gray-500">Automated patient check-up system overview</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {(loadingPatients || loadingCalls || loadingQuestionnaires || loadingApptStats) && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {(errorPatients || errorCalls || errorQuestionnaires || errorApptStats) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center text-sm text-red-700">
            Failed to load some dashboard data. Please refresh the page.
          </CardContent>
        </Card>
      )}

      {emergencyCalls.length > 0 && (
        <Card className="border-red-400 bg-red-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <Siren className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-base font-bold text-red-800">Active Emergencies — {emergencyCalls.length} patient{emergencyCalls.length > 1 ? "s" : ""} need immediate attention</h2>
            </div>
            <div className="space-y-2">
              {emergencyCalls.map((call: any) => (
                <div key={call._id} className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/calls/${call._id}`} className="text-sm font-semibold text-gray-900 hover:underline">{call.patient?.name || "Unknown"}</Link>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {call.redFlags?.filter((f: any) => f.tier === 0).map((f: any, i: number) => (
                          <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">{f.keyword}</span>
                        ))}
                        {call.aiSeverityScore >= 7 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">Severity: {call.aiSeverityScore}/10</span>
                        )}
                      </div>
                      {call.aiSummary && (
                        <p className="text-xs text-gray-500 truncate mt-0.5 max-w-md">{call.aiSummary}</p>
                      )}
                    </div>
                  </div>
                  {call.emergencyActionTaken === "none" && (user?.role === "admin" || user?.role === "doctor") && (
                    <div className="flex gap-1.5 shrink-0 ml-2">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs gap-1" onClick={() => setConfirmEmergency({ callId: call._id, target: "911" })} disabled={emergencyMutation.isPending}>
                        <Phone className="h-3 w-3" /> 911
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 h-8 text-xs gap-1" onClick={() => setConfirmEmergency({ callId: call._id, target: "clinic" })} disabled={emergencyMutation.isPending}>
                        <Phone className="h-3 w-3" /> Clinic
                      </Button>
                    </div>
                  )}
                  {call.emergencyActionTaken !== "none" && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-1 shrink-0 ml-2">
                      &#10003; {call.emergencyActionTaken === "called_911" ? "911 Called" : call.emergencyActionTaken === "called_clinic" ? "Clinic Called" : "Action Taken"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                <p className="text-sm text-gray-500">This will place an outbound call to {confirmEmergency.target === "911" ? "emergency services (911)" : "the clinic on-call number"}.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmEmergency(null)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  emergencyMutation.mutate(confirmEmergency);
                  setConfirmEmergency(null);
                }}
                disabled={emergencyMutation.isPending}
              >
                {emergencyMutation.isPending ? "Calling..." : `Call ${confirmEmergency.target === "911" ? "911" : "Clinic"}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Needs Attention</p>
                <p className="text-2xl font-bold text-red-600">{highSeverityCalls.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {mediumSeverityCalls.length} moderate risk patients
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Auto Checkups Today</p>
                <p className="text-2xl font-bold text-blue-600">{todayCalls.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {todayCalls.filter((c: any) => c.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Follow-ups Needed</p>
                <p className="text-2xl font-bold text-emerald-600">{needsFollowUp.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">Auto-detected by AI</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Patients Monitored</p>
                <p className="text-2xl font-bold text-violet-600">{patients.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">{questionnaires.length} active questionnaires</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">No-Show Rate</p>
                <p className="text-2xl font-bold text-amber-600">
                  {appointmentStats?.noShowRate != null ? `${appointmentStats.noShowRate}%` : "—"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {appointmentStats?.noShow || 0} no-shows of {appointmentStats?.total || 0} appointments
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Estimated Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointmentStats?.estimatedSavings != null ? `$${(appointmentStats.estimatedSavings).toLocaleString()}` : "—"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">From AI reminders reducing no-shows</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {highSeverityCalls.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  High Risk Patients — Needs Doctor Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {highSeverityCalls.slice(0, 4).map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3 hover:bg-red-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{call.patient?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500 truncate">
                          Severity: {call.aiSeverityScore}/10 &middot; {new Date(call.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {call.aiSummary && (
                        <span className="hidden md:inline-block max-w-[200px] truncate text-xs text-gray-500">
                          {call.aiSummary}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
                {highSeverityCalls.length > 4 && (
                  <Link to="/call-review" className="block text-center text-sm text-red-600 hover:underline pt-1">
                    View all {highSeverityCalls.length} high risk patients
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Latest AI Checkup Results
              </CardTitle>
              <Link to="/call-review" className="text-sm text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentCompleted.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <Brain className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">No checkups completed yet</p>
                  <p className="text-xs mt-1">Schedule calls and the AI will handle patient checkups automatically</p>
                </div>
              ) : (
                recentCompleted.map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        (call.aiSeverityScore || 0) >= 7 ? "bg-red-100" :
                        (call.aiSeverityScore || 0) >= 4 ? "bg-amber-100" :
                        "bg-emerald-100"
                      }`}>
                        <CheckCircle className={`h-4 w-4 ${
                          (call.aiSeverityScore || 0) >= 7 ? "text-red-600" :
                          (call.aiSeverityScore || 0) >= 4 ? "text-amber-600" :
                          "text-emerald-600"
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            (call.aiSeverityScore || 0) >= 7 ? "bg-red-100 text-red-700" :
                            (call.aiSeverityScore || 0) >= 4 ? "bg-amber-100 text-amber-700" :
                            "bg-emerald-100 text-emerald-700"
                          }`}>
                            {call.aiSeverityScore || "?"}/10
                          </span>
                        </div>
                        {call.aiSummary && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{call.aiSummary}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-gray-400">{new Date(call.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Auto-Calls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingScheduled.length === 0 ? (
                <div className="py-6 text-center text-gray-400">
                  <Clock className="mx-auto mb-2 h-6 w-6" />
                  <p className="text-sm">No scheduled calls</p>
                  <Link to="/patients" className="mt-2 inline-block text-xs text-primary hover:underline">
                    Schedule automated checkups
                  </Link>
                </div>
              ) : (
                upcomingScheduled.map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">
                        {call.scheduledAt
                          ? new Date(call.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "No date set"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                System Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-gray-600">Total Checkups</span>
                </div>
                <span className="font-bold">{completedCalls.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-gray-600">Avg Severity</span>
                </div>
                <span className="font-bold">
                  {completedCalls.length > 0
                    ? (completedCalls.reduce((s: number, c: any) => s + (c.aiSeverityScore || 0), 0) / completedCalls.length).toFixed(1)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">In Progress</span>
                </div>
                <span className="font-bold text-blue-600">{inProgressCalls.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-600">Failed</span>
                </div>
                <span className="font-bold text-red-600">{failedCalls.length}</span>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}
