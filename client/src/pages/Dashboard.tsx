import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { StatCard } from "@/components/ui/StatCard";
import { MiniBarChart, MiniPieChart, MiniLineChart } from "@/components/dashboard/MiniChart";
import { getHumanWidgets } from "@/components/dashboards/HumanDashboardWidgets";
import { getDentalWidgets } from "@/components/dashboards/DentalDashboardWidgets";
import { getVetWidgets } from "@/components/dashboards/VetDashboardWidgets";
import { medicalTemplates } from "@/data/medicalTemplates";
import { dentalTemplates } from "@/data/dentalTemplates";
import { veterinaryTemplates } from "@/data/veterinaryTemplates";
import {
  Phone, AlertTriangle, CheckCircle, Clock,
  Activity, Brain, Users, Calendar, TrendingUp,
  ArrowRight, BarChart3, Siren, ShieldAlert,
  Heart, Stethoscope, X,
  Eye, Award, ClipboardList, Star, Plus, Search, Save
} from "lucide-react";

const WIDGET_ICONS: Record<string, any> = {
  patientsToday: Users, appointments: Calendar, avgSeverity: TrendingUp,
  aiAssessments: Brain, followUps: Activity, ecgReads: Heart,
  bpAlerts: Activity, weeklyUnits: Activity, avgProgress: TrendingUp,
  moodAssessments: Brain, medReviews: Activity, activeTreatments: Activity,
  adjustmentsDue: Calendar, xraysPending: BarChart3, surgeriesToday: Phone,
  postOpFollowups: Activity, hygieneDue: Calendar, labCases: BarChart3,
  vaccinationsDue: Phone, farmVisits: Activity, cogginsTests: BarChart3,
  spayNeuterQueue: Calendar, dentalCleanings: Activity, wellnessExams: Stethoscope,
  inPatients: Users,
};

const CHART_COLORS = ["#0a7c6f", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

const SPECIALTY_SCALES: Record<string, Array<{ name: string; range: string; color: string }>> = {
  cardiology: [
    { name: "NYHA Functional Class", range: "Class I-IV", color: "red" },
    { name: "CCS Angina Classification", range: "Class I-IV", color: "amber" },
    { name: "ACC/AHA Heart Failure Stage", range: "Stage A-D", color: "blue" },
  ],
  neurology: [
    { name: "NIH Stroke Scale", range: "/42", color: "red" },
    { name: "MoCA Cognitive Screen", range: "/30", color: "blue" },
    { name: "MMSE", range: "/30", color: "emerald" },
    { name: "MIDAS Migraine Disability", range: "Grade I-IV", color: "amber" },
  ],
  psychiatry: [
    { name: "PHQ-9 Depression", range: "/27", color: "purple" },
    { name: "GAD-7 Anxiety", range: "/21", color: "blue" },
    { name: "C-SSRS Suicide Risk", range: "Screening", color: "red" },
    { name: "YMRS Mania", range: "/60", color: "amber" },
  ],
  dermatology: [
    { name: "PASI Score", range: "/72", color: "amber" },
    { name: "EASI Score", range: "Eczema", color: "blue" },
    { name: "Acne Grading", range: "Grade I-IV", color: "red" },
  ],
  therapy: [
    { name: "Berg Balance Scale", range: "/56", color: "emerald" },
    { name: "Tinetti Gait & Balance", range: "/28", color: "blue" },
    { name: "FIM Score", range: "/126", color: "violet" },
    { name: "Pain Scale", range: "0-10", color: "red" },
  ],
  gastroenterology: [
    { name: "Mayo Score (UC)", range: "0-12", color: "amber" },
    { name: "CDAI (Crohn's)", range: "Disease Activity", color: "blue" },
    { name: "Boston Bowel Prep", range: "0-9", color: "emerald" },
  ],
  endocrinology: [
    { name: "HbA1c Goal", range: "<7.0%", color: "amber" },
    { name: "CGM Time-in-Range", range: ">70%", color: "emerald" },
    { name: "Bone Density T-Score", range: "T-score", color: "blue" },
  ],
  oncology: [
    { name: "ECOG Performance", range: "0-5", color: "red" },
    { name: "RECIST 1.1 Response", range: "CR/PR/SD/PD", color: "amber" },
  ],
  rheumatology: [
    { name: "DAS28", range: "<2.6 to >5.1", color: "red" },
    { name: "BASDAI", range: "0-10", color: "blue" },
  ],
  nephrology: [
    { name: "CKD Stage (GFR)", range: "G1-G5", color: "amber" },
    { name: "Albuminuria Category", range: "A1-A3", color: "red" },
  ],
  pulmonology: [
    { name: "mMRC Dyspnea Scale", range: "0-4", color: "blue" },
    { name: "CAT Score", range: "0-40", color: "amber" },
    { name: "GOLD Stage", range: "1-4", color: "red" },
  ],
  ophthalmology: [
    { name: "Visual Acuity (Snellen)", range: "20/20-20/200", color: "blue" },
    { name: "Diabetic Retinopathy Stage", range: "NPDR-PDR", color: "red" },
    { name: "Cataract Grade", range: "1-4", color: "amber" },
  ],
  ent: [
    { name: "Hearing Loss Grade", range: "Normal-Profound", color: "blue" },
  ],
  "general-dentistry": [
    { name: "ADA Caries Risk", range: "Low/Med/High", color: "amber" },
    { name: "Periodontal Staging", range: "Stage I-IV", color: "red" },
    { name: "ASA Physical Status", range: "I-IV", color: "blue" },
  ],
  orthodontics: [
    { name: "Angle Classification", range: "Class I/II/III", color: "blue" },
    { name: "PAR Index", range: "0-100", color: "amber" },
  ],
  endodontics: [
    { name: "AAE Case Difficulty", range: "Minimal/Moderate/High", color: "amber" },
    { name: "Pulpal Diagnosis", range: "5 options", color: "red" },
  ],
  periodontics: [
    { name: "AAP Perio Stage", range: "I-IV", color: "red" },
    { name: "AAP Perio Grade", range: "A-C", color: "amber" },
    { name: "Furcation Hamp", range: "I-III", color: "blue" },
  ],
  "oral-surgery": [
    { name: "ASA Physical Status", range: "I-IV", color: "blue" },
    { name: "Bone Quality (Lekholm-Zarb)", range: "Type 1-4", color: "amber" },
  ],
  prosthodontics: [
    { name: "Kennedy Classification", range: "Class I-IV", color: "blue" },
    { name: "Crown-to-Root Ratio", range: "Assessment", color: "amber" },
  ],
  "pediatric-dentistry": [
    { name: "AAPD Caries Risk", range: "Low/Med/High", color: "amber" },
    { name: "Frankl Behavior Rating", range: "1-4", color: "emerald" },
  ],
  "small-animal": [
    { name: "Body Condition Score", range: "1-9", color: "amber" },
    { name: "Veterinary Pain Scale", range: "0-10", color: "red" },
  ],
  equine: [
    { name: "AAEP Lameness Grade", range: "0-5", color: "red" },
    { name: "Henneke Body Condition", range: "1-9", color: "amber" },
  ],
  "exotic-pets": [
    { name: "Body Condition Score", range: "1-5 (species-specific)", color: "amber" },
  ],
  "large-animal": [
    { name: "BCS", range: "1-9", color: "amber" },
    { name: "Bovine Lameness Score", range: "0-4", color: "red" },
  ],
  "vet-specialty": [
    { name: "Veterinary Pain Scale", range: "0-10", color: "red" },
  ],
};

const COLOR_CLASSES: Record<string, string> = {
  red: "text-red-600 bg-red-100 border-red-200",
  amber: "text-amber-600 bg-amber-100 border-amber-200",
  blue: "text-blue-600 bg-blue-100 border-blue-200",
  emerald: "text-emerald-600 bg-emerald-100 border-emerald-200",
  green: "text-green-600 bg-green-100 border-green-200",
  orange: "text-orange-600 bg-orange-100 border-orange-200",
  cyan: "text-cyan-600 bg-cyan-100 border-cyan-200",
  purple: "text-purple-600 bg-purple-100 border-purple-200",
  violet: "text-violet-600 bg-violet-100 border-violet-200",
  pink: "text-pink-600 bg-pink-100 border-pink-200",
};

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmEmergency, setConfirmEmergency] = useState<{ callId: string; target: "911" | "clinic" } | null>(null);
  const [showCallInstrForm, setShowCallInstrForm] = useState(false);
  const [callInstrDraft, setCallInstrDraft] = useState({ patientId: "", patientName: "", templateId: "", templateName: "", notes: "" });

  const specialty = user?.organization?.specialty || "general-practice";
  const clinicType = user?.organization?.clinicType || "human";

  const widgets = useMemo(() => {
    if (clinicType === "dental") return getDentalWidgets(specialty);
    if (clinicType === "veterinary") return getVetWidgets(specialty);
    return getHumanWidgets(specialty);
  }, [clinicType, specialty]);

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({ queryKey: ["dashboard-data"], queryFn: () => api.get("/clinic-config/dashboard-data").then((r) => r.data) });
  const { data: patientsData, isLoading: loadingPatients } = useQuery({ queryKey: ["patients"], queryFn: () => api.get("/patients").then((r) => r.data) });
  const { data: callsData, isLoading: loadingCalls } = useQuery({ queryKey: ["calls"], queryFn: () => api.get("/calls").then((r) => r.data) });
  const { data: appointmentStats } = useQuery({ queryKey: ["appointment-stats"], queryFn: () => api.get("/appointments/stats").then((r) => r.data) });
  const { data: qaScoresData } = useQuery({ queryKey: ["qa-scores"], queryFn: () => api.get("/qa/scores").then((r) => r.data) });
  const { data: qaTrendsData } = useQuery({ queryKey: ["qa-trends"], queryFn: () => api.get("/qa/trends?days=14").then((r) => r.data) });

  const emergencyMutation = useMutation({
    mutationFn: ({ callId, target }: { callId: string; target: "911" | "clinic" }) =>
      api.post(`/calls/${callId}/emergency/call`, { target }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      toast.success("Emergency call initiated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Emergency call failed"),
  });

  const updatePatientMutation = useMutation({
    mutationFn: ({ patientId, ...body }: any) => api.put(`/patients/${patientId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Call instructions saved (expires in 24h)");
      setShowCallInstrForm(false);
      setCallInstrDraft({ patientId: "", patientName: "", templateId: "", templateName: "", notes: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save"),
  });

  const allTemplates = useMemo(() => {
    if (clinicType === "dental") return dentalTemplates;
    if (clinicType === "veterinary") return veterinaryTemplates;
    return medicalTemplates;
  }, [clinicType]);

  const patients = patientsData?.patients || [];
  const activeInstructions = useMemo(() => {
    const now = new Date();
    return patients.filter((p: any) =>
      p.callInstructions?.templateName &&
      p.callInstructions?.expiresAt &&
      new Date(p.callInstructions.expiresAt) > now
    );
  }, [patients]);

  const calls = callsData?.calls || [];
  const completedCalls = calls.filter((c: any) => c.status === "completed");
  const scheduledCalls = calls.filter((c: any) => c.status === "scheduled");
  const inProgressCalls = calls.filter((c: any) => c.status === "in-progress");
  const failedCalls = calls.filter((c: any) => c.status === "failed");

  const emergencyCalls = calls.filter((c: any) =>
    c.emergencyDetected || c.redFlags?.some((f: any) => f.tier === 0) || (c.aiSeverityScore >= 7 && c.emergencyActionTaken === "none")
  );
  const highSeverity = calls.filter((c: any) => c.aiSeverityScore >= 7);

  const recentCompleted = [...completedCalls].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const upcomingScheduled = [...scheduledCalls].sort((a: any, b: any) => new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime()).slice(0, 5);

  const callVolumeData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
    }
    completedCalls.forEach((c: any) => {
      const day = new Date(c.createdAt).toLocaleDateString("en-US", { weekday: "short" });
      if (day in map) map[day]++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [completedCalls]);

  const severityData = useMemo(() => {
    const high = completedCalls.filter((c: any) => (c.aiSeverityScore || 0) >= 7).length;
    const med = completedCalls.filter((c: any) => (c.aiSeverityScore || 0) >= 4 && (c.aiSeverityScore || 0) < 7).length;
    const low = completedCalls.filter((c: any) => (c.aiSeverityScore || 0) < 4).length;
    return [
      { name: "Low", value: low || 1 },
      { name: "Medium", value: med || 1 },
      { name: "High", value: high || 1 },
    ];
  }, [completedCalls]);

  const WidgetIcon = (name: string) => WIDGET_ICONS[name] || Activity;
  const isLoading = loadingPatients || loadingCalls || loadingDashboard;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Section 1: Greeting + Quick Actions ── */}
        <GreetingHeader userName={user?.name || ""} userRole={user?.role || ""} />

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* ── Section 2: Emergency Alerts ── */}
        {emergencyCalls.length > 0 && (
          <div className="overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 shadow-sm">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                    <Siren className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-800">
                    Active Emergencies
                  </h2>
                  <p className="text-sm text-red-600">
                    {emergencyCalls.length} patient{emergencyCalls.length > 1 ? "s" : ""} need immediate attention
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {emergencyCalls.map((call: any) => (
                  <div key={call._id} className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={`/calls/${call._id}`} className="text-sm font-semibold text-gray-900 hover:underline">
                          {call.patient?.name || "Unknown"}
                        </Link>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {call.redFlags?.filter((f: any) => f.tier === 0).map((f: any, i: number) => (
                            <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              {f.keyword}
                            </span>
                          ))}
                          {call.aiSeverityScore >= 7 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Severity: {call.aiSeverityScore}/10
                            </span>
                          )}
                        </div>
                        {call.aiSummary && <p className="text-xs text-gray-500 truncate mt-0.5 max-w-md">{call.aiSummary}</p>}
                      </div>
                    </div>
                    {call.emergencyActionTaken === "none" && (user?.role === "admin" || user?.role === "doctor") && (
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs gap-1 rounded-lg" onClick={() => setConfirmEmergency({ callId: call._id, target: "911" })} disabled={emergencyMutation.isPending}>
                          <Phone className="h-3 w-3" /> 911
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 h-8 text-xs gap-1 rounded-lg" onClick={() => setConfirmEmergency({ callId: call._id, target: "clinic" })} disabled={emergencyMutation.isPending}>
                          <Phone className="h-3 w-3" /> Clinic
                        </Button>
                      </div>
                    )}
                    {call.emergencyActionTaken !== "none" && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-3 py-1 shrink-0 ml-2">
                        &#10003; {call.emergencyActionTaken === "called_911" ? "911 Called" : "Action Taken"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Emergency Confirm Modal ── */}
        {confirmEmergency && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmEmergency(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirm Emergency Call</h3>
                  <p className="text-sm text-gray-500">This will place an outbound call to {confirmEmergency.target === "911" ? "emergency services (911)" : "the clinic on-call number"}.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setConfirmEmergency(null)}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={() => { emergencyMutation.mutate(confirmEmergency); setConfirmEmergency(null); }} disabled={emergencyMutation.isPending}>
                  {emergencyMutation.isPending ? "Calling..." : `Call ${confirmEmergency.target === "911" ? "911" : "Clinic"}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* ── Section 3: Key Metrics ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {widgets.map((w) => {
                const IconComp = WidgetIcon(w.key);
                const value = dashboardData?.data?.[w.key];
                const displayValue = value !== undefined && value !== null
                  ? value
                  : (w.key === "avgSeverity" || w.key === "avgProgress" ? "—" : "0");
                return (
                  <StatCard
                    key={w.key}
                    icon={IconComp}
                    label={w.label}
                    value={displayValue}
                    accent={
                      w.color === "blue" ? "#2563eb" :
                      w.color === "red" ? "#ef4444" :
                      w.color === "emerald" ? "#10b981" :
                      w.color === "amber" ? "#f59e0b" :
                      w.color === "violet" ? "#8b5cf6" :
                      w.color === "green" ? "#22c55e" :
                      w.color === "orange" ? "#f97316" :
                      w.color === "cyan" ? "#06b6d4" :
                      w.color === "purple" ? "#a855f7" :
                      w.color === "pink" ? "#ec4899" : "#6b7280"
                    }
                  />
                );
              })}
            </div>

            {/* ── Section 4: Analytics Snapshot ── */}
            <CollapsibleSection
              id="analytics"
              title="Analytics & Insights"
              icon={<BarChart3 className="h-4 w-4" />}
              badge={completedCalls.length > 0 ? completedCalls.length : undefined}
              defaultOpen={true}
              accentColor="#0a7c6f"
            >
              <div className="space-y-5 p-5">
                {/* QA Summary Row */}
                {(dashboardData?.data || qaScoresData?.summary) && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={Calendar} label="No-Show Rate" value={appointmentStats?.noShowRate ?? (dashboardData?.data?.noShowRate || "—")} accent="#2563eb" />
                    <StatCard icon={Award} label="Avg QA Score" value={`${qaScoresData?.summary?.averageOverall ?? "—"}${qaScoresData?.summary?.averageOverall ? "%" : ""}`} accent="#10b981" />
                    <StatCard icon={Eye} label="Accuracy" value={`${qaScoresData?.summary?.averageAccuracy ?? "—"}${qaScoresData?.summary?.averageAccuracy ? "%" : ""}`} accent="#f59e0b" />
                    <StatCard icon={Heart} label="Empathy" value={`${qaScoresData?.summary?.averageEmpathy ?? "—"}${qaScoresData?.summary?.averageEmpathy ? "%" : ""}`} accent="#a855f7" />
                  </div>
                )}

                {/* Charts Row */}
                {completedCalls.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-gray-700">Call Volume (Last 7 Days)</span>
                      </div>
                      <MiniBarChart data={callVolumeData} />
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold text-gray-700">Severity Distribution</span>
                      </div>
                      <MiniPieChart data={severityData} colors={["#10b981", "#f59e0b", "#ef4444"]} />
                      <div className="mt-2 flex justify-center gap-4">
                        {severityData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ["#10b981", "#f59e0b", "#ef4444"][i] }} />
                            <span className="text-[10px] font-medium text-gray-500">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {qaTrendsData?.trends?.length > 0 && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-gray-700">QA Score Trend</span>
                        </div>
                        <MiniLineChart data={qaTrendsData.trends.slice(-7)} dataKey="avgScore" />
                      </div>
                    )}
                  </div>
                )}

                {/* Admin: Condition Prevalence + High Risk */}
                {user?.role === "admin" && dashboardData?.data?.conditionPrevalence?.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-gray-700">Condition Prevalence (Last 30 Days)</span>
                      </div>
                      <MiniPieChart
                        data={dashboardData.data.conditionPrevalence.map((c: any) => ({ name: c.name || c._id, value: c.count }))}
                        colors={CHART_COLORS}
                        innerRadius={40}
                        outerRadius={70}
                        height={180}
                      />
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-semibold text-gray-700">High-Risk Patients</span>
                      </div>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {dashboardData.data.highRiskPatients?.length === 0 ? (
                          <div className="py-6 text-center text-gray-400 text-sm">No high-risk patients detected</div>
                        ) : (
                          dashboardData.data.highRiskPatients?.slice(0, 6).map((hp: any, i: number) => (
                            <Link key={i} to={`/calls/${hp._id}`} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-2.5 hover:bg-red-50 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{hp.patient?.name || "Unknown"}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{hp.conditionName || "Severity"} · {hp.aiSeverityScore}/10</p>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* ── Section 5: Clinical Tools ── */}
            {(user?.role === "admin" || user?.role === "doctor") && (
              <CollapsibleSection
                id="clinical"
                title="Clinical Tools"
                icon={<Stethoscope className="h-4 w-4" />}
                badge={activeInstructions.length > 0 ? activeInstructions.length : undefined}
                defaultOpen={true}
                accentColor="#2563eb"
              >
                <div className="space-y-5 p-5">
                  {/* Specialty Scales */}
                  {user?.role === "admin" && SPECIALTY_SCALES[specialty]?.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Scales</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {SPECIALTY_SCALES[specialty].map((scale, i) => {
                          const colorClasses = COLOR_CLASSES[scale.color] || "text-gray-600 bg-gray-100 border-gray-200";
                          const parts = colorClasses.split(" ");
                          return (
                            <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 ${parts[1]} ${parts[2]}`}>
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${parts[1]}`}>
                                <Activity className={`h-4 w-4 ${parts[0]}`} />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-900">{scale.name}</p>
                                <p className="text-[10px] text-gray-500">{scale.range}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Call Instructions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Call Instructions</p>
                      {(user?.role === "admin" || user?.role === "doctor") && (
                        <Button variant="outline" size="sm" className="rounded-lg text-xs h-7" onClick={() => setShowCallInstrForm(!showCallInstrForm)}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>

                    {showCallInstrForm && (
                      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">Set Call Instruction (expires in 24h)</p>
                          <button onClick={() => setShowCallInstrForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search patient..."
                            value={callInstrDraft.patientName}
                            onChange={(e) => { setCallInstrDraft({ ...callInstrDraft, patientName: e.target.value, patientId: "" }); }}
                            className="flex w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm"
                          />
                          {callInstrDraft.patientName && !callInstrDraft.patientId && (
                            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-40 overflow-y-auto">
                              {patients.filter((p: any) => p.name?.toLowerCase().includes(callInstrDraft.patientName.toLowerCase())).slice(0, 5).map((p: any) => (
                                <button key={p._id} onClick={() => setCallInstrDraft({ ...callInstrDraft, patientId: p._id, patientName: p.name })}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">{p.name}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        <select value={callInstrDraft.templateId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) { setCallInstrDraft({ ...callInstrDraft, templateId: "", templateName: "" }); return; }
                            const q = allTemplates.find((t: any) => t.id === val);
                            if (q) { setCallInstrDraft({ ...callInstrDraft, templateId: val, templateName: q.condition || val }); }
                          }}
                          className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                          <option value="">Select template...</option>
                          {allTemplates.map((t) => <option key={t.id} value={t.id}>{t.condition}</option>)}
                        </select>
                        <textarea value={callInstrDraft.notes} onChange={(e) => setCallInstrDraft({ ...callInstrDraft, notes: e.target.value })}
                          rows={2} className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          placeholder="Notes for staff..." />
                        <Button size="sm" className="rounded-lg" disabled={!callInstrDraft.patientId || !callInstrDraft.templateId || updatePatientMutation.isPending}
                          onClick={() => updatePatientMutation.mutate({
                            patientId: callInstrDraft.patientId,
                            callInstructions: { templateId: callInstrDraft.templateId, templateName: callInstrDraft.templateName, notes: callInstrDraft.notes, setBy: user?._id, setAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
                          })}>
                          <Save className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                      </div>
                    )}

                    {activeInstructions.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <ClipboardList className="mx-auto mb-2 h-8 w-8" />
                        <p className="text-sm">No active call instructions today</p>
                        <p className="text-xs mt-1">{(user?.role === "admin" || user?.role === "doctor") ? "Add instructions for your patients above" : "No instructions set by doctors today"}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeInstructions.map((p: any) => {
                          const ci = p.callInstructions;
                          const hoursLeft = Math.max(0, Math.round((new Date(ci.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
                          const setByName = ci.setBy?.name || "Doctor";
                          return (
                            <div key={p._id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 hover:bg-amber-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                                  <Star className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 truncate">{p.name || "Unknown"}</p>
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">{ci.templateName}</span>
                                  </div>
                                  {ci.notes && <p className="text-xs text-gray-500 truncate mt-0.5">{ci.notes}</p>}
                                  <p className="text-[10px] text-gray-400 mt-0.5">Set by {setByName} · expires in {hoursLeft}h</p>
                                </div>
                              </div>
                              <Link to={`/voice-agent?patientId=${p._id}&patientName=${encodeURIComponent(p.name)}`}
                                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors">
                                Schedule Call
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* ── Section 6: Patient Activity ── */}
            <CollapsibleSection
              id="activity"
              title="Patient Activity"
              icon={<Users className="h-4 w-4" />}
              badge={highSeverity.length > 0 ? highSeverity.length : undefined}
              defaultOpen={true}
              accentColor="#f59e0b"
            >
              <div className="p-5">
                <div className="grid gap-5 lg:grid-cols-3">
                  {/* Main: High Risk + Recent Checkups */}
                  <div className="lg:col-span-2 space-y-4">
                    {highSeverity.length > 0 && (
                      <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-semibold text-red-700">High Risk Patients ({highSeverity.length})</span>
                        </div>
                        <div className="space-y-2">
                          {highSeverity.slice(0, 4).map((call: any) => (
                            <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3 hover:bg-red-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
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
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-gray-700">Latest AI Checkup Results</span>
                        </div>
                        <Link to="/call-review" className="text-xs font-medium text-primary hover:underline">View all</Link>
                      </div>
                      <div className="space-y-2">
                        {recentCompleted.length === 0 ? (
                          <div className="py-8 text-center text-gray-400">
                            <Brain className="mx-auto mb-2 h-8 w-8" />
                            <p className="text-sm">No checkups completed yet</p>
                            <p className="text-xs mt-1">Schedule calls and the AI will handle patient checkups automatically</p>
                          </div>
                        ) : (
                          recentCompleted.map((call: any) => (
                            <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${(call.aiSeverityScore || 0) >= 7 ? "bg-red-100" : (call.aiSeverityScore || 0) >= 4 ? "bg-amber-100" : "bg-emerald-100"}`}>
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
                              <span className="text-xs text-gray-400 shrink-0 ml-2">{new Date(call.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar: Upcoming Calls */}
                  <div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-semibold text-gray-700">Upcoming Auto-Calls</span>
                      </div>
                      <div className="space-y-2">
                        {upcomingScheduled.length === 0 ? (
                          <div className="py-6 text-center text-gray-400">
                            <Clock className="mx-auto mb-2 h-6 w-6" />
                            <p className="text-sm">No scheduled calls</p>
                            <Link to="/patients" className="mt-2 inline-block text-xs text-primary hover:underline">Schedule automated checkups</Link>
                          </div>
                        ) : (
                          upcomingScheduled.map((call: any) => (
                            <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                                <Clock className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                                <p className="text-xs text-gray-500">{call.scheduledAt ? new Date(call.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No date set"}</p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* ── Section 7: System Overview ── */}
            <CollapsibleSection
              id="system"
              title="System Overview"
              icon={<BarChart3 className="h-4 w-4" />}
              defaultOpen={false}
              accentColor="#6b7280"
            >
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Checkups</p>
                        <p className="text-lg font-bold">{completedCalls.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                        <TrendingUp className="h-4.5 w-4.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Severity</p>
                        <p className="text-lg font-bold">{completedCalls.length > 0 ? (completedCalls.reduce((s: number, c: any) => s + (c.aiSeverityScore || 0), 0) / completedCalls.length).toFixed(1) : "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                        <Activity className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">In Progress</p>
                        <p className="text-lg font-bold text-blue-600">{inProgressCalls.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                        <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Failed</p>
                        <p className="text-lg font-bold text-red-600">{failedCalls.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                        <Calendar className="h-4.5 w-4.5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">No-Show Rate</p>
                        <p className="text-lg font-bold">{dashboardData?.data?.noShowRate || "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100">
                        <Users className="h-4.5 w-4.5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Active Patients</p>
                        <p className="text-lg font-bold">{dashboardData?.data?.activeTreatments || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                        <Award className="h-4.5 w-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total AI Checkups</p>
                        <p className="text-lg font-bold">{dashboardData?.data?.aiAssessments || completedCalls.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100">
                        <Heart className="h-4.5 w-4.5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Follow-ups Needed</p>
                        <p className="text-lg font-bold">{calls.filter((c: any) => { const s = c.aiSummary || ""; return s.includes("follow") || s.includes("urgent") || (c.aiSeverityScore || 0) >= 5; }).length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>
    </div>
  );
}
