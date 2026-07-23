import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import Logo from "@/components/ui/Logo";
import {
  Activity, AlertTriangle, ArrowUp, BarChart3, Calendar, ChevronRight, Clock, Eye,
  Heart, Maximize2, Minimize2, Phone, Radio, RefreshCw, Shield, TrendingUp, Users, X,
  DollarSign, UserCheck, FileText, Building2, Brain, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const TEAL = "#0a7c6f";
const TEAL_LIGHT = "#14b8a6";
const TEAL_PALE = "#d1fae5";
const CHARTS = [TEAL, "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

const SEVERITY_COLORS = [
  { name: "Low", color: "#10b981", bg: "bg-emerald-100", text: "text-emerald-700" },
  { name: "Medium", color: "#f59e0b", bg: "bg-amber-100", text: "text-amber-700" },
  { name: "High", color: "#ef4444", bg: "bg-red-100", text: "text-red-700" },
];

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

function getTileMeta(severity: number | null, status?: string) {
  if (status === "emergency") return { label: "Emergency", color: "#ef4444", bg: "bg-red-50", border: "border-red-400", iconColor: "text-red-500", ring: "ring-red-400" };
  if (status === "critical" || (severity != null && severity >= 7)) return { label: "Critical", color: "#ef4444", bg: "bg-red-50", border: "border-red-300", iconColor: "text-red-500", ring: "ring-red-400" };
  if (status === "watching" || (severity != null && severity >= 4)) return { label: "Watching", color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-300", iconColor: "text-amber-500", ring: "ring-amber-400" };
  if (severity != null) return { label: "Stable", color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-300", iconColor: "text-emerald-500", ring: "ring-emerald-400" };
  return { label: "No Data", color: "#9ca3af", bg: "bg-gray-50", border: "border-gray-200", iconColor: "text-gray-400", ring: "ring-gray-300" };
}

const TV_VIEWS = ["overview", "population", "risk", "summary"] as const;

function IndexGauge({ score, size = 180 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 36) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedScore / 100);
  const isGood = score >= 75;
  const isModerate = score >= 50;
  const gaugeColor = isGood ? TEAL : isModerate ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    let start: number | null = null;
    const dur = 1500;
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setAnimatedScore(Math.round(p * score));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={TEAL} />
          <stop offset="100%" stopColor={TEAL_LIGHT} />
        </linearGradient>
        <filter id="gGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={gaugeColor} floodOpacity="0.3" />
        </filter>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={12} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isGood ? "url(#gGrad)" : gaugeColor}
        strokeWidth={12} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} filter="url(#gGlow)"
        style={{ transition: "stroke-dashoffset 0.05s linear" }} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={gaugeColor} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={`${circumference * 0.12} ${circumference}`} strokeDashoffset={offset - circumference * 0.02}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} opacity={0.25} />
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill="#111827" fontSize={36} fontWeight="bold" fontFamily="system-ui">{animatedScore}</text>
      <text x={size / 2} y={size / 2 + 18} textAnchor="middle" fill="#6b7280" fontSize={10} fontFamily="system-ui" letterSpacing="1.5">ORIVEO INDEX</text>
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "text-gray-900", accent = TEAL }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; accent?: string;
}) {
  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-md hover:border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: accent + "15" }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        {sub && <span className="text-[10px] font-medium text-gray-400">{sub}</span>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function SeverityDonut({ data }: { data: { low: number; medium: number; high: number } }) {
  const chartData = [
    { name: "Low", value: data.low || 0 },
    { name: "Medium", value: data.medium || 0 },
    { name: "High", value: data.high || 0 },
  ];
  const total = chartData.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={130} height={130}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" stroke="none">
            {chartData.map((_, i) => <Cell key={i} fill={SEVERITY_COLORS[i].color} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {chartData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[i].color }} />
            <span className="text-gray-500 w-12">{d.name}</span>
            <span className="font-semibold text-gray-700">{d.value}</span>
            {total > 0 && <span className="text-gray-400">({Math.round((d.value / total) * 100)}%)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [tvMode, setTvMode] = useState(false);
  const [tvView, setTvView] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const rotateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["population-health"],
    queryFn: () => api.get("/population-health/summary").then((r) => r.data),
    refetchInterval: tvMode ? 30000 : 15000,
  });

  const { data: biomarkerData } = useQuery({
    queryKey: ["biomarkers", "flagged"],
    queryFn: () => api.get("/biomarkers/flagged").then((r) => r.data),
    refetchInterval: tvMode ? 60000 : 30000,
  });

  const { data: biomarkerStats } = useQuery({
    queryKey: ["biomarkers", "stats"],
    queryFn: () => api.get("/biomarkers/stats").then((r) => r.data),
    refetchInterval: tvMode ? 60000 : 30000,
  });

  const d = data || {} as any;
  const {
    oriveoIndex = 0, indexBreakdown, patientTiles = [], liveActivity = [],
    riskPredictions = [], practiceStats = {}, appointmentStats = {},
    teamStats = {}, subscription, callStatusBreakdown = {},
    callVolume = [], severityDistribution = {},
  } = d;

  useEffect(() => {
    if (!tvMode) return;
    let idx = 0;
    function rotate() {
      if (!paused) { idx = (idx + 1) % TV_VIEWS.length; setTvView(idx); }
      rotateTimer.current = setTimeout(rotate, 12000);
    }
    rotateTimer.current = setTimeout(rotate, 12000);
    return () => { if (rotateTimer.current) clearTimeout(rotateTimer.current); };
  }, [tvMode, paused]);

  const handleManualRefresh = useCallback(() => {
    refetch();
    setLastRefreshed(new Date());
  }, [refetch]);

  const toggleTvMode = useCallback(async () => {
    if (!tvMode) {
      setTvView(0); setTvMode(true);
      try { await containerRef.current?.requestFullscreen(); } catch {}
    } else {
      setTvMode(false);
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
    }
  }, [tvMode]);

  useEffect(() => {
    if (!tvMode) return;
    const handler = () => { if (!document.fullscreenElement) setTvMode(false); };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [tvMode]);

  useEffect(() => {
    if (!tvMode) return;
    const interval = setInterval(() => {
      window.location.reload();
    }, 3600000);
    return () => clearInterval(interval);
  }, [tvMode]);

  const breakdown = useMemo(() => indexBreakdown ? [
    { label: "Call Completion", value: indexBreakdown.callCompletion || 0, icon: Phone },
    { label: "Severity Control", value: indexBreakdown.severityTrend || 0, icon: TrendingUp },
    { label: "QA Score", value: indexBreakdown.qaScore || 0, icon: Shield },
    { label: "Engagement", value: indexBreakdown.engagement || 0, icon: Users },
    { label: "No-Show Prevention", value: indexBreakdown.noShowInverse || 0, icon: Calendar },
  ] : [], [indexBreakdown]);

  const activityIcons: Record<string, any> = {
    emergency: AlertTriangle, checkup_complete: Heart, call_failed: X, call_started: Phone,
  };

  const callData = callVolume.length > 0 ? callVolume : [];
  const sevData = severityDistribution;

  // Total calls from status breakdown
  const statusTotal = Object.values(callStatusBreakdown).reduce((a: number, b: any) => a + (b || 0), 0);
  const statusData = Object.entries(callStatusBreakdown).map(([k, v]) => ({ name: k, value: v || 0 }));
  const statusColors: Record<string, string> = {
    completed: TEAL, "in-progress": "#3b82f6", waiting: "#f59e0b", failed: "#ef4444", cancelled: "#9ca3af",
  };

  const apptKeys = appointmentStats?.today || {};
  const totalApptsToday = appointmentStats?.totalToday || 0;

  const tileCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of patientTiles) {
      const meta = getTileMeta(t.severity, t.status);
      c[meta.label] = (c[meta.label] || 0) + 1;
    }
    return c;
  }, [patientTiles]);

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0a7c6f] border-t-transparent" />
          <p className="text-sm text-gray-400">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  const mainContent = (
    <div className="space-y-5">
      {/* ═══ SECTION 1: ORIVEO INDEX + STATS ═══ */}
      <div className="flex gap-5">
        {/* Oriveo Index Area */}
        <div className="w-[270px] shrink-0">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex justify-center">
              <IndexGauge score={oriveoIndex} size={180} />
            </div>
            <div className="mt-4 space-y-2 divide-y divide-gray-50">
              {breakdown.map((b, i) => (
                <div key={b.label} className="pt-2 first:pt-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{b.label}</span>
                    <span className="font-semibold text-gray-800">{b.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.value}%`, backgroundColor: CHARTS[i % CHARTS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Patients" value={practiceStats.totalPatients ?? 0} accent={TEAL} />
          <StatCard icon={Phone} label="Checkups Today" value={practiceStats.callsToday ?? 0} accent={TEAL_LIGHT} />
          <StatCard icon={Calendar} label="Appointments Today" value={totalApptsToday} sub={appointmentStats?.completed? `+${appointmentStats.completed} done` : ""} accent="#6366f1" />
          <StatCard icon={Shield} label="Avg QA Score" value={practiceStats.avgQA ?? 0} sub="/100" accent="#8b5cf6" />

          <StatCard icon={BarChart3} label="No-Show Rate" value={`${practiceStats.noShowRate ?? 0}%`} accent="#f59e0b" />
          <StatCard icon={Activity} label="Active Calls" value={practiceStats.activeCalls ?? 0} sub={practiceStats.emergencies > 0 ? `${practiceStats.emergencies} emergencies` : ""} accent={practiceStats.emergencies > 0 ? "#ef4444" : TEAL} />
          <StatCard icon={UserCheck} label="Team Members" value={teamStats.total ?? 0} sub={`${teamStats.doctor || 0} doctors, ${teamStats.nurse || 0} nurses`} accent="#6366f1" />
          <StatCard icon={Building2} label="Plan" value={subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : "Starter"} sub={subscription?.status || "active"} accent={TEAL} />
        </div>
      </div>

      {/* ═══ SECTION 2: CLINICAL OPERATIONS ═══ */}
      <div className="grid grid-cols-4 gap-4">
        {/* Call Volume */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider">CALL VOLUME</h3>
            <span className="text-[10px] text-gray-400">Last 7 days</span>
          </div>
          {callData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={callData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={20} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={TEAL} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[120px] text-xs text-gray-400">No data</div>
          )}
        </div>

        {/* Severity Distribution */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider">SEVERITY DISTRIBUTION</h3>
          </div>
          {statusTotal > 0 ? (
            <SeverityDonut data={sevData} />
          ) : (
            <div className="flex items-center justify-center h-[120px] text-xs text-gray-400">No completed calls</div>
          )}
        </div>

        {/* Completion Rate */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider">COMPLETION RATE</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <svg width={90} height={90} viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke="#e5e7eb" strokeWidth={8} />
                <circle cx="45" cy="45" r="36" fill="none" stroke={TEAL} strokeWidth={8} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={2 * Math.PI * 36 * (1 - (practiceStats.completionRate || 0) / 100)}
                  transform="rotate(-90 45 45)" />
                <text x="45" y="45" textAnchor="middle" dominantBaseline="central" fill="#111827" fontSize={22} fontWeight="bold" fontFamily="system-ui">
                  {practiceStats.completionRate || 0}%
                </text>
              </svg>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs text-gray-500">Avg Duration</div>
              <div className="text-lg font-bold text-gray-900">{practiceStats.avgDuration ? `${Math.floor(practiceStats.avgDuration / 60)}m ${practiceStats.avgDuration % 60}s` : "—"}</div>
              <div className="text-xs text-gray-500">Avg Severity: {practiceStats.avgSeverity ?? "—"}/10</div>
            </div>
          </div>
        </div>

        {/* Call Status */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider">CALL STATUS</h3>
            <span className="text-[10px] text-gray-400">{statusTotal} total</span>
          </div>
          {statusData.length > 0 ? (
            <div className="space-y-2">
              {statusData.slice(0, 4).map((s: any) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[s.name] || "#9ca3af" }} />
                  <span className="text-gray-500 w-20 capitalize">{s.name.replace("-", " ")}</span>
                  <span className="font-semibold text-gray-700">{s.value}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${(s.value / statusTotal) * 100}%`, backgroundColor: statusColors[s.name] || "#9ca3af" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[120px] text-xs text-gray-400">No data</div>
          )}
        </div>
      </div>

      {/* ═══ SECTION 3: PATIENT POPULATION ═══ */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-700 tracking-wider">PATIENT POPULATION</h2>
            <div className="flex items-center gap-2 text-[10px]">
              {Object.entries(tileCounts).map(([label, count]) => {
                const c = label === "Emergency" ? "#ef4444" : label === "Critical" ? "#ef4444" : label === "Watching" ? "#f59e0b" : label === "Stable" ? "#10b981" : "#9ca3af";
                return (
                  <span key={label} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                    {label}: {count}
                  </span>
                );
              })}
            </div>
          </div>
          <span className="text-xs text-gray-400">{patientTiles.length} patients</span>
        </div>
        <div className="grid grid-cols-6 gap-2.5">
          {patientTiles.slice(0, 24).map((p: any) => {
            const meta = getTileMeta(p.severity, p.status);
            return (
              <div key={p._id} className={`group relative rounded-lg border ${meta.border} ${meta.bg} p-3 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    {p.condition && <p className="text-[10px] text-gray-500 truncate">{p.condition}</p>}
                  </div>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white`} style={{ backgroundColor: meta.color }}>
                    {p.severity ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-gray-400">
                    {p.daysSinceLastCall != null ? `${p.daysSinceLastCall}d` : "—"}
                  </span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                </div>
              </div>
            );
          })}
          {patientTiles.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-8 text-sm text-gray-400">
              <Users className="h-8 w-8 mr-2 text-gray-300" /> No patients yet
            </div>
          )}
        </div>
      </div>

      {/* ═══ SECTION 4: ACTIVITY + RISK + FINANCIAL ═══ */}
      <div className="grid grid-cols-12 gap-4">
        {/* Live Activity */}
        <div className="col-span-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-[#0a7c6f]" />
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider">LIVE ACTIVITY</h3>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-gray-400">LIVE</span>
            </span>
          </div>
          <div className="space-y-0.5 max-h-[260px] overflow-y-auto scrollbar-thin">
            {liveActivity.map((a: any, i: number) => {
              const Icon = activityIcons[a.type] || Activity;
              const isEmerg = a.type === "emergency";
              return (
                <div key={i} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${isEmerg ? "bg-red-50" : "hover:bg-gray-50"}`}>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isEmerg ? "bg-red-100" : "bg-gray-100"}`}>
                    <Icon className={`h-3 w-3 ${isEmerg ? "text-red-500" : "text-gray-500"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${isEmerg ? "text-red-700 font-medium" : "text-gray-700"}`}>
                      {a.message} — <span className="font-semibold">{a.patient}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {a.severity != null && (
                      <span className={`text-[10px] font-bold ${a.severity >= 7 ? "text-red-500" : a.severity >= 4 ? "text-amber-500" : "text-emerald-500"}`}>
                        {a.severity}/10
                      </span>
                    )}
                    <span className="text-[9px] text-gray-400">{formatRelativeTime(a.timestamp)}</span>
                  </div>
                </div>
              );
            })}
            {liveActivity.length === 0 && (
              <div className="flex items-center justify-center py-8 text-xs text-gray-400">
                <Activity className="h-5 w-5 mr-1.5" /> No activity today
              </div>
            )}
          </div>
        </div>

        {/* Financial + Team */}
        <div className="col-span-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider">FINANCIAL</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Plan</span>
              <span className="font-semibold text-gray-800 capitalize">{subscription?.plan || "Starter"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Status</span>
              <span className={`font-semibold capitalize ${subscription?.status === "active" ? "text-emerald-600" : "text-amber-600"}`}>{subscription?.status || "Active"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Team Limit</span>
              <span className="font-semibold text-gray-800">{teamStats.total ?? 0}/{subscription?.maxUsers ?? 5}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Patient Limit</span>
              <span className="font-semibold text-gray-800">{practiceStats.totalPatients ?? 0}/{subscription?.maxPatients ?? 500}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Monthly Calls</span>
              <span className="font-semibold text-gray-800">{statusTotal}/{subscription?.maxMonthlyCalls ?? 1000}</span>
            </div>
          </div>
          {subscription?.maxMonthlyCalls && (
            <div className="mt-2.5 h-1.5 rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-[#0a7c6f] transition-all" style={{ width: `${Math.min(100, (statusTotal / subscription.maxMonthlyCalls) * 100)}%` }} />
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2.5">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider">TEAM</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(teamStats).filter(([k]) => k !== "total").map(([role, count]) => (
                <div key={role} className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5">
                  <span className="text-gray-500 capitalize">{role}</span>
                  <span className="font-bold text-gray-800">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Watch */}
        <div className="col-span-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider">RISK WATCH</h3>
            </div>
            {riskPredictions.length > 0 && (
              <span className="text-[10px] font-semibold text-red-500">{riskPredictions.length} at risk</span>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {riskPredictions.slice(0, 4).map((r: any) => (
              <div key={r.patientId} className="min-w-[180px] flex-1 rounded-lg border border-red-100 bg-red-50/50 p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{r.patientName}</h4>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
                    <ArrowUp className="h-2.5 w-2.5" /> {r.currentSeverity}→{r.predictedSeverity}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-red-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all" style={{ width: `${(r.currentSeverity / 10) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-500">Trending upward — schedule review</p>
              </div>
            ))}
            {riskPredictions.length === 0 && (
              <div className="flex items-center w-full justify-center py-6 text-xs text-gray-400">
                <Shield className="h-5 w-5 mr-1.5 text-emerald-400" /> All patients stable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 5: VOICE BIOMARKERS ═══ */}
      <div className="grid grid-cols-12 gap-4">
        {/* Biomarker Stats */}
        <div className="col-span-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-3.5 w-3.5 text-purple-500" />
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider">VOICE BIOMARKERS</h3>
          </div>
          {biomarkerStats ? (
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Calls Analyzed</span>
                <span className="font-semibold text-gray-800">{biomarkerStats.totalCalls || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Avg Health Index</span>
                <span className={`font-semibold ${(biomarkerStats.avgHealthIndex || 0) >= 70 ? "text-emerald-600" : (biomarkerStats.avgHealthIndex || 0) >= 45 ? "text-amber-600" : "text-red-600"}`}>
                  {Math.round(biomarkerStats.avgHealthIndex || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Declining</span>
                <span className="font-semibold text-red-600">{biomarkerStats.decliningCount || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Improving</span>
                <span className="font-semibold text-emerald-600">{biomarkerStats.improvingCount || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Recent Flags (7d)</span>
                <span className="font-semibold text-amber-600">{biomarkerStats.recentFlags || 0}</span>
              </div>
              {biomarkerStats.totalBillable > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><DollarSign className="h-3 w-3" />Billable Touchpoints</span>
                    <span className="font-bold text-emerald-600">${biomarkerStats.totalBillable}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[120px] text-xs text-gray-400">No biomarker data yet</div>
          )}
        </div>

        {/* Flagged Patients */}
        <div className="col-span-8 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider">BIOMARKER FLAGGED PATIENTS</h3>
            </div>
            {biomarkerData?.flagged?.length > 0 && (
              <span className="text-[10px] font-semibold text-red-500">{biomarkerData.flagged.length} flagged</span>
            )}
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin">
            {(biomarkerData?.flagged || []).slice(0, 8).map((f: any) => (
              <div key={f._id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/patients/${f._id}`)}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  (f.healthIndex || 0) < 35 ? "bg-red-100" : (f.healthIndex || 0) < 50 ? "bg-amber-100" : "bg-emerald-100"
                }`}>
                  <Brain className={`h-4 w-4 ${
                    (f.healthIndex || 0) < 35 ? "text-red-600" : (f.healthIndex || 0) < 50 ? "text-amber-600" : "text-emerald-600"
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{f.patient?.name || "Unknown"}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      (f.healthIndex || 0) < 35 ? "bg-red-100 text-red-600" : (f.healthIndex || 0) < 50 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    }`}>HI: {f.healthIndex}</span>
                    {f.decliningStreak >= 3 && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <TrendingDown className="h-2.5 w-2.5" /> {f.decliningStreak}x
                      </span>
                    )}
                  </div>
                  {f.patient?.primaryDiagnosis && (
                    <p className="text-[10px] text-gray-500 truncate">{f.patient.primaryDiagnosis}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(f.latestFlags || []).slice(0, 2).map((flag: any, i: number) => (
                    <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${
                      flag.severity === "high" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    }`}>{flag.type.replace(/_/g, " ")}</span>
                  ))}
                  {f.proactiveCare?.triggered && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5">
                      <DollarSign className="h-2.5 w-2.5" />{f.proactiveCare.billableCode}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!biomarkerData?.flagged || biomarkerData.flagged.length === 0) && (
              <div className="flex items-center w-full justify-center py-8 text-xs text-gray-400">
                <Brain className="h-5 w-5 mr-1.5 text-purple-400" /> No flagged patients — all biomarkers normal
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════
     TV MODE CONTENT
     ════════════════════════════════════════════════════ */
  const tvContent = (
    <div className="flex h-[calc(100vh-60px)] items-center justify-center p-8">
      {TV_VIEWS[tvView] === "overview" && (
        <div className="flex items-center justify-center gap-16">
          <div className="flex flex-col items-center">
            <IndexGauge score={oriveoIndex} size={260} />
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 w-80">
              {breakdown.slice(0, 4).map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHARTS[breakdown.indexOf(b) % CHARTS.length] }} />
                  <span className="text-gray-500">{b.label}</span>
                  <span className="ml-auto font-semibold text-gray-800">{b.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Total Patients", value: practiceStats.totalPatients ?? 0, icon: Users, color: "text-blue-600" },
              { label: "Active Calls", value: practiceStats.activeCalls ?? 0, icon: Phone, color: "text-emerald-600" },
              { label: "Today's Checkups", value: practiceStats.callsToday ?? 0, icon: Activity, color: "text-amber-600" },
              { label: "Emergencies", value: practiceStats.emergencies ?? 0, icon: AlertTriangle, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-sm border border-gray-100 min-w-[180px]">
                <s.icon className={`h-8 w-8 ${s.color} mb-3`} />
                <span className="text-4xl font-bold text-gray-900">{s.value}</span>
                <span className="mt-1 text-sm text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {TV_VIEWS[tvView] === "population" && (
        <div className="w-full max-w-6xl">
          <h2 className="mb-6 text-center text-sm font-semibold text-gray-400 tracking-widest">PATIENT POPULATION</h2>
          <div className="grid grid-cols-6 gap-3">
            {patientTiles.slice(0, 24).map((p: any) => {
              const meta = getTileMeta(p.severity, p.status);
              return (
                <div key={p._id} className={`rounded-xl ${meta.bg} border ${meta.border} p-4 text-center`}>
                  <p className="text-base font-bold text-gray-900 truncate">{p.name}</p>
                  {p.condition && <p className="text-xs text-gray-500 truncate mt-0.5">{p.condition}</p>}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: meta.color }}>
                      {p.severity ?? "—"}
                    </span>
                    <span className="text-xs text-gray-400">{p.daysSinceLastCall != null ? `${p.daysSinceLastCall}d` : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {TV_VIEWS[tvView] === "risk" && (
        <div className="w-full max-w-5xl">
          <h2 className="mb-6 text-center text-sm font-semibold text-red-500 tracking-widest">RISK WATCH</h2>
          {riskPredictions.length > 0 ? (
            <div className="grid grid-cols-2 gap-6">
              {riskPredictions.slice(0, 4).map((r: any) => (
                <div key={r.patientId} className="rounded-2xl border border-red-200 bg-red-50/50 p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{r.patientName}</h3>
                    <span className="flex items-center gap-1 text-red-500 text-sm font-semibold">
                      <ArrowUp className="h-4 w-4" /> {r.currentSeverity}→{r.predictedSeverity}
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-red-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all" style={{ width: `${(r.currentSeverity / 10) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Current severity: {r.currentSeverity}/10</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Shield className="h-12 w-12 mb-3 text-emerald-400" />
              <p className="text-lg text-gray-600">No patients at risk</p>
              <p className="text-sm mt-1 text-gray-400">All severity trends are stable</p>
            </div>
          )}
        </div>
      )}
      {TV_VIEWS[tvView] === "summary" && (
        <div className="flex flex-col items-center">
          <IndexGauge score={oriveoIndex} size={300} />
          <div className="mt-8 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {oriveoIndex >= 75 ? "Excellent population health" : oriveoIndex >= 50 ? "Moderate — room to improve" : "Needs attention"}
            </p>
            <div className="mt-4 flex gap-4 justify-center text-sm text-gray-500">
              <span>{practiceStats.completionRate ?? 0}% completion</span>
              <span className="text-gray-300">|</span>
              <span>{practiceStats.callsToday ?? 0} checkups today</span>
              <span className="text-gray-300">|</span>
              <span>{practiceStats.totalPatients ?? 0} total patients</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">Powered by Oriveo AI</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {TV_VIEWS.map((v, i) => (
          <button key={v} onClick={() => { setTvView(i); setPaused(true); setTimeout(() => setPaused(false), 8000); }}
            className={`h-2 w-2 rounded-full transition-all ${tvView === i ? "bg-teal-600 w-6" : "bg-gray-300 hover:bg-gray-400"}`} />
        ))}
        <button onClick={() => setPaused(!paused)} className="ml-4 text-xs text-gray-400 hover:text-gray-600">
          {paused ? "▶ Auto" : "⏸ Pause"}
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={tvMode ? "fixed inset-0 z-[9999] bg-white overflow-hidden" : "min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 p-4 lg:p-6"}>
      {/* Header */}
      <div className={`flex items-center justify-between ${tvMode ? "px-4 pt-4 pb-2" : "mb-5"}`}>
        <div className="flex items-center gap-3">
          <Logo size="sm" showText={!tvMode} variant="dark" />
          {tvMode && (
            <span className="text-[10px] text-gray-400 ml-2">Updated {lastRefreshed.toLocaleTimeString()}</span>
          )}
          {!tvMode && practiceStats && (
            <div className="hidden md:flex items-center gap-3 ml-4 text-[11px] text-gray-400">
              <span>{practiceStats.totalPatients} patients</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{practiceStats.callsToday} checkups today</span>
              {practiceStats.emergencies > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-red-500 font-medium">{practiceStats.emergencies} emergencies</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleManualRefresh} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors shadow-sm" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={toggleTvMode} className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
            {tvMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {tvMode ? "Exit" : "TV Mode"}
          </button>
          {!tvMode && (
            <button onClick={() => navigate("/dashboard")} className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
              <X className="h-3.5 w-3.5" /> Exit
            </button>
          )}
        </div>
      </div>

      {tvMode ? tvContent : mainContent}
    </div>
  );
}
