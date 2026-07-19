import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getHumanWidgets } from "@/components/dashboards/HumanDashboardWidgets";
import { getDentalWidgets } from "@/components/dashboards/DentalDashboardWidgets";
import { getVetWidgets } from "@/components/dashboards/VetDashboardWidgets";
import {
  Phone, AlertTriangle, CheckCircle, Clock,
  Activity, Brain, Users, Calendar, TrendingUp,
  ArrowRight, Mic, BarChart3, Siren, ShieldAlert, DollarSign
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  blue: "text-blue-600 bg-blue-100",
  red: "text-red-600 bg-red-100",
  emerald: "text-emerald-600 bg-emerald-100",
  amber: "text-amber-600 bg-amber-100",
  violet: "text-violet-600 bg-violet-100",
  green: "text-green-600 bg-green-100",
  orange: "text-orange-600 bg-orange-100",
  cyan: "text-cyan-600 bg-cyan-100",
  purple: "text-purple-600 bg-purple-100",
  pink: "text-pink-600 bg-pink-100",
};

const WIDGET_ICONS: Record<string, any> = {
  patientsToday: Users,
  appointments: Calendar,
  avgSeverity: TrendingUp,
  aiAssessments: Brain,
  followUps: Activity,
  ecgReads: Heart,
  bpAlerts: Activity,
  weeklyUnits: Activity,
  avgProgress: TrendingUp,
  moodAssessments: Brain,
  medReviews: Activity,
  activeTreatments: Activity,
  adjustmentsDue: Calendar,
  xraysPending: BarChart3,
  surgeriesToday: Phone,
  postOpFollowups: Activity,
  hygieneDue: Calendar,
  labCases: BarChart3,
  vaccinationsDue: Phone,
  farmVisits: Activity,
  cogginsTests: BarChart3,
  spayNeuterQueue: Calendar,
  dentalCleanings: Activity,
  wellnessExams: Stethoscope,
  inPatients: Users,
};

import { Heart, Stethoscope } from "lucide-react";

const SPECIALTY_LABELS: Record<string, { title: string; subtitle: string }> = {
  "general-practice": { title: "General Practice Dashboard", subtitle: "Family medicine & primary care overview" },
  "cardiology": { title: "Cardiology Dashboard", subtitle: "Cardiovascular care & diagnostics overview" },
  "pediatrics": { title: "Pediatrics Dashboard", subtitle: "Child health & wellness overview" },
  "neurology": { title: "Neurology Dashboard", subtitle: "Neurological care overview" },
  "psychiatry": { title: "Psychiatry Dashboard", subtitle: "Mental health & behavioral care overview" },
  "dermatology": { title: "Dermatology Dashboard", subtitle: "Skin health & dermatology overview" },
  "therapy": { title: "Therapy Dashboard", subtitle: "Rehabilitative therapy overview" },
  "gastroenterology": { title: "Gastroenterology Dashboard", subtitle: "Digestive health overview" },
  "endocrinology": { title: "Endocrinology Dashboard", subtitle: "Hormone & metabolic health overview" },
  "oncology": { title: "Oncology Dashboard", subtitle: "Cancer care overview" },
  "rheumatology": { title: "Rheumatology Dashboard", subtitle: "Rheumatic & autoimmune care overview" },
  "nephrology": { title: "Nephrology Dashboard", subtitle: "Kidney health overview" },
  "pulmonology": { title: "Pulmonology Dashboard", subtitle: "Respiratory care overview" },
  "ophthalmology": { title: "Ophthalmology Dashboard", subtitle: "Vision & eye health overview" },
  "ent": { title: "ENT Dashboard", subtitle: "Ear, nose & throat overview" },
  "general-dentistry": { title: "Dental Dashboard", subtitle: "General dentistry overview" },
  "orthodontics": { title: "Orthodontics Dashboard", subtitle: "Orthodontic treatment overview" },
  "endodontics": { title: "Endodontics Dashboard", subtitle: "Root canal & endodontic overview" },
  "periodontics": { title: "Periodontics Dashboard", subtitle: "Gum health & perio overview" },
  "oral-surgery": { title: "Oral Surgery Dashboard", subtitle: "Surgical dentistry overview" },
  "prosthodontics": { title: "Prosthodontics Dashboard", subtitle: "Restorative dentistry overview" },
  "pediatric-dentistry": { title: "Pediatric Dentistry Dashboard", subtitle: "Children's dental care overview" },
  "small-animal": { title: "Small Animal Dashboard", subtitle: "Dog & cat practice overview" },
  "equine": { title: "Equine Dashboard", subtitle: "Horse practice overview" },
  "exotic-pets": { title: "Exotic Pets Dashboard", subtitle: "Avian, reptile & small mammal overview" },
  "large-animal": { title: "Large Animal Dashboard", subtitle: "Bovine & ovine practice overview" },
  "mixed-animal": { title: "Mixed Animal Dashboard", subtitle: "Multi-species practice overview" },
  "vet-specialty": { title: "Veterinary Specialty Dashboard", subtitle: "Specialty vet care overview" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmEmergency, setConfirmEmergency] = useState<{ callId: string; target: "911" | "clinic" } | null>(null);

  const specialty = user?.organization?.specialty || "general-practice";
  const clinicType = user?.organization?.clinicType || "human";

  const labels = SPECIALTY_LABELS[specialty] || { title: "Medical Dashboard", subtitle: "Automated patient check-up system overview" };

  const widgets = useMemo(() => {
    if (clinicType === "dental") return getDentalWidgets(specialty);
    if (clinicType === "veterinary") return getVetWidgets(specialty);
    return getHumanWidgets(specialty);
  }, [clinicType, specialty]);

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({ queryKey: ["dashboard-data"], queryFn: () => api.get("/clinic-config/dashboard-data").then((r) => r.data) });
  const { data: patientsData, isLoading: loadingPatients } = useQuery({ queryKey: ["patients"], queryFn: () => api.get("/patients").then((r) => r.data) });
  const { data: callsData, isLoading: loadingCalls } = useQuery({ queryKey: ["calls"], queryFn: () => api.get("/calls").then((r) => r.data) });
  const { data: appointmentStats } = useQuery({ queryKey: ["appointment-stats"], queryFn: () => api.get("/appointments/stats").then((r) => r.data) });

  const emergencyMutation = useMutation({
    mutationFn: ({ callId, target }: { callId: string; target: "911" | "clinic" }) =>
      api.post(`/calls/${callId}/emergency/call`, { target }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      toast.success("Emergency call initiated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Emergency call failed"),
  });

  const patients = patientsData?.patients || [];
  const calls = callsData?.calls || [];
  const completedCalls = calls.filter((c: any) => c.status === "completed");
  const scheduledCalls = calls.filter((c: any) => c.status === "scheduled");
  const inProgressCalls = calls.filter((c: any) => c.status === "in-progress");
  const failedCalls = calls.filter((c: any) => c.status === "failed");

  const emergencyCalls = calls.filter((c: any) =>
    c.emergencyDetected || c.redFlags?.some((f: any) => f.tier === 0) || (c.aiSeverityScore >= 7 && c.emergencyActionTaken === "none")
  );
  const highSeverity = calls.filter((c: any) => c.aiSeverityScore >= 7);
  const needsFollowUp = calls.filter((c: any) => {
    const s = c.aiSummary || ""; return s.includes("follow") || s.includes("urgent") || (c.aiSeverityScore || 0) >= 5;
  });

  const todayCalls = calls.filter((c: any) => {
    const t = new Date(); const d = new Date(c.createdAt); return d.toDateString() === t.toDateString();
  });

  const recentCompleted = [...completedCalls].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const upcomingScheduled = [...scheduledCalls].sort((a: any, b: any) => new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime()).slice(0, 5);

  const WidgetIcon = (name: string) => WIDGET_ICONS[name] || Activity;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
          <p className="text-gray-500">{labels.subtitle}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {(loadingPatients || loadingCalls || loadingDashboard) && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
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
                      {call.aiSummary && <p className="text-xs text-gray-500 truncate mt-0.5 max-w-md">{call.aiSummary}</p>}
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
                      &#10003; {call.emergencyActionTaken === "called_911" ? "911 Called" : "Action Taken"}
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
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { emergencyMutation.mutate(confirmEmergency); setConfirmEmergency(null); }} disabled={emergencyMutation.isPending}>
                {emergencyMutation.isPending ? "Calling..." : `Call ${confirmEmergency.target === "911" ? "911" : "Clinic"}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {widgets.map((w) => {
          const iconName = w.key;
          const IconComp = WidgetIcon(iconName);
          const colorClass = ICON_MAP[w.color] || "text-gray-600 bg-gray-100";
          const value = dashboardData?.data?.[w.key];
          const displayValue = value !== undefined && value !== null
            ? value
            : (w.key === "avgSeverity" || w.key === "avgProgress" ? "—" : "0");
          return (
            <Card key={w.key} className="border-l-4 border-l-current" style={{ borderLeftColor: `var(--${w.color}-500)` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{w.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {highSeverity.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  High Risk Patients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {highSeverity.slice(0, 4).map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3 hover:bg-red-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{call.patient?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500 truncate">Severity: {call.aiSeverityScore}/10 · {new Date(call.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
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
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${(call.aiSeverityScore || 0) >= 7 ? "bg-red-100" : (call.aiSeverityScore || 0) >= 4 ? "bg-amber-100" : "bg-emerald-100"}`}>
                        <CheckCircle className={`h-4 w-4 ${(call.aiSeverityScore || 0) >= 7 ? "text-red-600" : (call.aiSeverityScore || 0) >= 4 ? "text-amber-600" : "text-emerald-600"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(call.aiSeverityScore || 0) >= 7 ? "bg-red-100 text-red-700" : (call.aiSeverityScore || 0) >= 4 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {call.aiSeverityScore || "?"}/10
                          </span>
                        </div>
                        {call.aiSummary && <p className="text-xs text-gray-500 truncate mt-0.5">{call.aiSummary}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(call.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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
                  <Link to="/patients" className="mt-2 inline-block text-xs text-primary hover:underline">Schedule automated checkups</Link>
                </div>
              ) : (
                upcomingScheduled.map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{call.scheduledAt ? new Date(call.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No date set"}</p>
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
                <span className="font-bold">{completedCalls.length > 0 ? (completedCalls.reduce((s: number, c: any) => s + (c.aiSeverityScore || 0), 0) / completedCalls.length).toFixed(1) : "—"}</span>
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
