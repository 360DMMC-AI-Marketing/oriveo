import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, Minus, Brain,
  Heart, Wind, Zap, Smile, Frown, Loader2, Phone, DollarSign,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

const BIOMARKER_META: Record<string, { icon: any; label: string; color: string; desc: string }> = {
  respiratory: { icon: Wind, label: "Respiratory", color: "#3b82f6", desc: "Breathing patterns & effort" },
  cognitive: { icon: Brain, label: "Cognitive", color: "#8b5cf6", desc: "Mental clarity & processing" },
  fatigue: { icon: Zap, label: "Fatigue", color: "#f59e0b", desc: "Energy & exhaustion levels" },
  mood: { icon: Smile, label: "Mood", color: "#10b981", desc: "Emotional state & engagement" },
  pain: { icon: Frown, label: "Pain", color: "#ef4444", desc: "Discomfort & pain signals" },
  anxiety: { icon: Heart, label: "Anxiety", color: "#ec4899", desc: "Stress & worry levels" },
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Good" : score >= 45 ? "Moderate" : "Concerning";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 264} 264`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-gray-400">/100</span>
        </div>
      </div>
      <span className="text-xs font-medium mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

export default function VoiceBiomarkersTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["biomarkers", patientId],
    queryFn: () => api.get(`/biomarkers/patient/${patientId}?limit=20`).then((r) => r.data),
  });

  const processMutation = useMutation({
    mutationFn: () => api.post(`/biomarkers/process-batch`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["biomarkers", patientId] });
      toast.success(`Processed ${res.data.processed} calls`);
    },
    onError: () => toast.error("Failed to process biomarkers"),
  });

  const markers = data?.markers || [];
  const latest = markers[markers.length - 1];

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  if (markers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No voice biomarker data yet</p>
          <p className="text-sm text-gray-400 mt-1">Biomarkers are extracted automatically from completed calls</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => processMutation.mutate()} disabled={processMutation.isPending}>
            {processMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Process Existing Calls
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Build trend chart data
  const trendData = markers.map((m: any, i: number) => ({
    index: i + 1,
    date: new Date(m.createdAt).toLocaleDateString(),
    health: m.healthIndex,
    respiratory: m.biomarkers?.respiratory,
    cognitive: m.biomarkers?.cognitive,
    fatigue: m.biomarkers?.fatigue,
    mood: m.biomarkers?.mood,
    pain: m.biomarkers?.pain,
    anxiety: m.biomarkers?.anxiety,
  }));

  // Radar data for latest
  const radarData = latest ? Object.entries(BIOMARKER_META).map(([key, meta]) => ({
    biomarker: meta.label,
    score: latest.biomarkers?.[key] ?? 50,
    fullMark: 100,
  })) : [];

  // Active flags
  const activeFlags = latest?.flags || [];
  const allFlags = markers.flatMap((m: any) => (m.flags || []).map((f: any) => ({ ...f, date: m.createdAt })));
  const recentFlags = allFlags.slice(-10);

  return (
    <div className="space-y-4">
      {/* Overview Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex flex-col items-center">
            <HealthGauge score={latest.healthIndex ?? 50} />
            <p className="text-xs text-gray-400 mt-2">Health Index</p>
            {latest.trend?.healthIndexDelta !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon trend={latest.trend?.healthIndexTrend || "stable"} />
                <span className={`text-xs font-medium ${latest.trend?.healthIndexDelta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {latest.trend?.healthIndexDelta > 0 ? "+" : ""}{latest.trend?.healthIndexDelta}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs">Biomarker Radar</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="biomarker" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Score" dataKey="score" stroke="#0a7c6f" fill="#0a7c6f" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs">Active Flags</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2">
            {activeFlags.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No active flags</p>
            ) : (
              activeFlags.map((flag: any, i: number) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg p-2 ${
                  flag.severity === "high" ? "bg-red-50" : "bg-amber-50"
                }`}>
                  <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                    flag.severity === "high" ? "text-red-500" : "text-amber-500"
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{flag.type.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-gray-500">{flag.message}</p>
                  </div>
                </div>
              ))
            )}
            {latest.proactiveCare?.triggered && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Proactive Care Triggered
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{latest.proactiveCare.triggerReason}</p>
                {latest.proactiveCare.billableCode && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600">
                    <DollarSign className="h-3 w-3" />
                    {latest.proactiveCare.billableCode} — ~${latest.proactiveCare.billableAmount} reimbursement
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Index Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Health Index Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="index" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: any) => [value, "Health Index"]}
              />
              <Line type="monotone" dataKey="health" stroke="#0a7c6f" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Individual Biomarker Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Biomarker Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="index" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="respiratory" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Respiratory" />
              <Line type="monotone" dataKey="cognitive" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Cognitive" />
              <Line type="monotone" dataKey="fatigue" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Fatigue" />
              <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={1.5} dot={false} name="Mood" />
              <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Pain" />
              <Line type="monotone" dataKey="anxiety" stroke="#ec4899" strokeWidth={1.5} dot={false} name="Anxiety" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {Object.entries(BIOMARKER_META).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biomarker Score Cards */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(BIOMARKER_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const score = latest.biomarkers?.[key] ?? 50;
          const color = score >= 70 ? "text-emerald-600" : score >= 45 ? "text-amber-600" : "text-red-600";
          const bg = score >= 70 ? "bg-emerald-50" : score >= 45 ? "bg-amber-50" : "bg-red-50";
          return (
            <Card key={key}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500">{meta.label}</p>
                    <p className={`text-lg font-bold ${color}`}>{score}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{meta.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Flag History */}
      {recentFlags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Flags</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              {recentFlags.map((flag: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <AlertTriangle className={`h-3 w-3 shrink-0 ${flag.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                  <span className="text-gray-500">{new Date(flag.date).toLocaleDateString()}</span>
                  <span className="text-gray-700 capitalize">{flag.type.replace(/_/g, " ")}</span>
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                    flag.severity === "high" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                  }`}>{flag.severity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
