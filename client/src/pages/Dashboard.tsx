import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatCard } from "@/components/ui/StatCard";
import { MiniBarChart, MiniPieChart } from "@/components/dashboard/MiniChart";
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
  Heart, Stethoscope, X, Mic,
  Eye, Award, ClipboardList, Star, Plus, Search, Save
} from "lucide-react";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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
  const firstName = user?.name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  function accentFromColor(color: string): string {
    const map: Record<string, string> = {
      blue: "#2563eb", red: "#ef4444", emerald: "#10b981", amber: "#f59e0b",
      violet: "#8b5cf6", green: "#22c55e", orange: "#f97316", cyan: "#06b6d4",
      purple: "#a855f7", pink: "#ec4899",
    };
    return map[color] || "#6b7280";
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Emergency Alert Banner ── */}
      {emergencyCalls.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 shadow-sm">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <Siren className="h-5 w-5 text-red-600" />
                </div>
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-800">Active Emergencies</h2>
                <p className="text-sm text-red-600">{emergencyCalls.length} patient{emergencyCalls.length > 1 ? "s" : ""} need immediate attention</p>
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
                      <Link to={`/calls/${call._id}`} className="text-sm font-semibold text-gray-900 hover:underline">{call.patient?.name || "Unknown"}</Link>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {call.redFlags?.filter((f: any) => f.tier === 0).map((f: any, i: number) => (
                          <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{f.keyword}</span>
                        ))}
                        {call.aiSeverityScore >= 7 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Severity: {call.aiSeverityScore}/10</span>
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

      {/* ── Section 1: Greeting + Quick Actions ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/voice-agent"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
          >
            <Phone className="h-3.5 w-3.5" />
            Schedule Call
          </Link>
          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
          >
            <Users className="h-3.5 w-3.5" />
            Patients
          </Link>
          <Link
            to="/call-review"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
          >
            <Mic className="h-3.5 w-3.5" />
            AI Review
          </Link>
        </div>
      </div>

      {/* ── Section 2: Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              accent={accentFromColor(w.color)}
            />
          );
        })}
      </div>

      {/* ── Section 3: Two-Column Main Content ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Analytics + Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* QA Mini Stats */}
          {(dashboardData?.data || qaScoresData?.summary) && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">No-Show Rate</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{appointmentStats?.noShowRate ?? (dashboardData?.data?.noShowRate || "—")}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Avg QA Score</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{qaScoresData?.summary?.averageOverall ?? "—"}{qaScoresData?.summary?.averageOverall ? "%" : ""}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{qaScoresData?.summary?.averageAccuracy ?? "—"}{qaScoresData?.summary?.averageAccuracy ? "%" : ""}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Empathy</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{qaScoresData?.summary?.averageEmpathy ?? "—"}{qaScoresData?.summary?.averageEmpathy ? "%" : ""}</p>
              </div>
            </div>
          )}

          {/* Charts */}
          {completedCalls.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  Call Volume (Last 7 Days)
                </p>
                <MiniBarChart data={callVolumeData} />
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Severity Distribution
                </p>
                <MiniPieChart data={severityData} colors={["#10b981", "#f59e0b", "#ef4444"]} />
              </div>
            </div>
          )}

          {/* Admin: Condition Prevalence + High Risk */}
          {user?.role === "admin" && dashboardData?.data?.conditionPrevalence?.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Condition Prevalence
                </p>
                <MiniPieChart
                  data={dashboardData.data.conditionPrevalence.map((c: any) => ({ name: c.name || c._id, value: c.count }))}
                  colors={CHART_COLORS}
                  innerRadius={40}
                  outerRadius={70}
                  height={180}
                />
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                  High-Risk Patients
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
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

        {/* Right: Recent Activity + Quick Info */}
        <div className="space-y-6">
          {/* Recent Checkups */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-gray-700">Recent Checkups</span>
              </div>
              <Link to="/call-review" className="text-xs font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="p-3 space-y-2">
              {recentCompleted.length === 0 ? (
                <div className="py-6 text-center text-gray-400">
                  <Brain className="mx-auto mb-2 h-6 w-6" />
                  <p className="text-xs">No checkups yet</p>
                </div>
              ) : (
                recentCompleted.map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${(call.aiSeverityScore || 0) >= 7 ? "bg-red-100" : (call.aiSeverityScore || 0) >= 4 ? "bg-amber-100" : "bg-emerald-100"}`}>
                      <CheckCircle className={`h-4 w-4 ${(call.aiSeverityScore || 0) >= 7 ? "text-red-600" : (call.aiSeverityScore || 0) >= 4 ? "text-amber-600" : "text-emerald-600"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500 truncate">{call.aiSeverityScore ? `Severity: ${call.aiSeverityScore}/10` : "Completed"}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(call.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Calls */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-700">Upcoming Calls</span>
              {upcomingScheduled.length > 0 && (
                <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{upcomingScheduled.length}</span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {upcomingScheduled.length === 0 ? (
                <div className="py-6 text-center text-gray-400">
                  <Clock className="mx-auto mb-2 h-5 w-5" />
                  <p className="text-xs">No scheduled calls</p>
                </div>
              ) : (
                upcomingScheduled.map((call: any) => (
                  <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{call.scheduledAt ? new Date(call.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No date"}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {(user?.role === "admin" || user?.role === "doctor") && (
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-gray-700">Today's Call Instructions</span>
                  {activeInstructions.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{activeInstructions.length}</span>
                  )}
                </div>
                <Button variant="outline" size="sm" className="rounded-lg text-xs h-7" onClick={() => setShowCallInstrForm(!showCallInstrForm)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              <div className="p-3 space-y-2">
                {showCallInstrForm && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Set Call Instruction</p>
                      <button onClick={() => setShowCallInstrForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Search patient..." value={callInstrDraft.patientName}
                        onChange={(e) => { setCallInstrDraft({ ...callInstrDraft, patientName: e.target.value, patientId: "" }); }}
                        className="flex w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm" />
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
                      rows={2} className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Notes for staff..." />
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
                  <div className="py-4 text-center text-gray-400">
                    <ClipboardList className="mx-auto mb-2 h-5 w-5" />
                    <p className="text-xs">No active call instructions today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeInstructions.map((p: any) => {
                      const ci = p.callInstructions;
                      const hoursLeft = Math.max(0, Math.round((new Date(ci.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
                      return (
                        <div key={p._id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Star className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <p className="text-xs font-medium truncate">{p.name || "Unknown"}</p>
                            </div>
                            <p className="text-[10px] text-gray-500">
                              {ci.templateName} · expires in {hoursLeft}h
                            </p>
                          </div>
                          <Link to={`/voice-agent?patientId=${p._id}&patientName=${encodeURIComponent(p.name)}`}
                            className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-medium text-white hover:bg-primary/90 transition-colors ml-2">
                            Call
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Summary */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">System Summary</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-600">Total Checkups</span>
                <span className="text-sm font-bold">{completedCalls.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-600">Avg Severity</span>
                <span className="text-sm font-bold">{completedCalls.length > 0 ? (completedCalls.reduce((s: number, c: any) => s + (c.aiSeverityScore || 0), 0) / completedCalls.length).toFixed(1) : "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-600">In Progress</span>
                <span className="text-sm font-bold text-blue-600">{inProgressCalls.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-600">Failed</span>
                <span className="text-sm font-bold text-red-600">{failedCalls.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-600">No-Show Rate</span>
                <span className="text-sm font-bold">{dashboardData?.data?.noShowRate || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-600">Active Patients</span>
                <span className="text-sm font-bold">{dashboardData?.data?.activeTreatments || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-600">AI Checkups</span>
                <span className="text-sm font-bold">{dashboardData?.data?.aiAssessments || completedCalls.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Specialty Scales (admin only) ── */}
      {user?.role === "admin" && SPECIALTY_SCALES[specialty]?.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-gray-700">Clinical Assessment Scales</span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      )}

      {/* ── High Risk Patients (bottom, if not shown above) ── */}
      {highSeverity.length > 0 && (user?.role !== "admin" || !dashboardData?.data?.conditionPrevalence?.length) && (
        <div className="rounded-xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 px-5 py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold">High Risk Patients</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 ml-auto">{highSeverity.length}</span>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {highSeverity.slice(0, 4).map((call: any) => (
              <Link key={call._id} to={`/calls/${call._id}`} className="flex items-center justify-between rounded-lg border border-red-200 p-3 hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{call.patient?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">Severity: {call.aiSeverityScore}/10</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── QA Score Trend (bottom chart) ── */}
      {qaTrendsData?.trends?.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-gray-700">QA Score Trend (Last 14 Days)</span>
            </div>
          </div>
          <div className="p-5">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qaTrendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="avgScore" stroke="#0a7c6f" strokeWidth={2.5} dot={{ r: 3, fill: "#0a7c6f" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
