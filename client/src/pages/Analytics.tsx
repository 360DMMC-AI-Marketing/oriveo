import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, Phone, Clock, CheckCircle2, XCircle,
  AlertTriangle, Brain, Activity, Calendar, Star, Mail,
  FileDown, Edit3, Eye, Send, X,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useCallback } from "react";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

export default function Analytics() {
  const { data: patientsData } = useQuery({ queryKey: ["patients"], queryFn: () => api.get("/patients").then((r) => r.data) });
  const { data: callsData } = useQuery({ queryKey: ["calls"], queryFn: () => api.get("/calls").then((r) => r.data) });
  const { data: usersData } = useQuery({ queryKey: ["users"], queryFn: () => api.get("/users").then((r) => r.data) });
  const { data: qaScoresData } = useQuery({ queryKey: ["qa-scores"], queryFn: () => api.get("/qa/scores").then((r) => r.data) });
  const { data: qaTrendsData } = useQuery({ queryKey: ["qa-trends"], queryFn: () => api.get("/qa/trends?days=30").then((r) => r.data) });

  const patients = patientsData?.patients || [];
  const calls = callsData?.calls || [];
  const users = usersData?.users || [];
  const qaSummary = qaScoresData?.summary;

  const completedCalls = calls.filter((c: any) => c.status === "completed");
  const failedCalls = calls.filter((c: any) => c.status === "failed");
  const scheduledCalls = calls.filter((c: any) => c.status === "scheduled");
  const inProgressCalls = calls.filter((c: any) => c.status === "in-progress");

  const avgSeverity = completedCalls.length > 0
    ? (completedCalls.reduce((sum: number, c: any) => sum + (c.aiSeverityScore || 0), 0) / completedCalls.length).toFixed(1)
    : "0.0";

  const highSeverity = completedCalls.filter((c: any) => (c.aiSeverityScore || 0) >= 7).length;
  const mediumSeverity = completedCalls.filter((c: any) => (c.aiSeverityScore || 0) >= 4 && (c.aiSeverityScore || 0) < 7).length;
  const lowSeverity = completedCalls.filter((c: any) => (c.aiSeverityScore || 0) < 4).length;

  const callOutcomeData = [
    { name: "Completed", value: completedCalls.length, color: "#10b981" },
    { name: "Failed", value: failedCalls.length, color: "#ef4444" },
    { name: "In Progress", value: inProgressCalls.length, color: "#3b82f6" },
    { name: "Scheduled", value: scheduledCalls.length, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const severityData = [
    { name: "High (7-10)", value: highSeverity, color: "#ef4444" },
    { name: "Medium (4-6)", value: mediumSeverity, color: "#f59e0b" },
    { name: "Low (1-3)", value: lowSeverity, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const callsByDay: any[] = [];
  const dayMap = new Map();
  const answerDayMap = new Map();
  calls.forEach((call: any) => {
    const date = new Date(call.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dayMap.set(date, (dayMap.get(date) || 0) + 1);
    if (call.patientResponded === true) {
      answerDayMap.set(date, (answerDayMap.get(date) || 0) + 1);
    }
  });
  dayMap.forEach((count, date) => {
    const answered = answerDayMap.get(date) || 0;
    callsByDay.push({ date, calls: count, answered, answerRate: count > 0 ? Math.round(answered / count * 100) : 0 });
  });
  callsByDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const appointmentCalls = calls.filter((c: any) => c.nextAppointmentDate);
  const appointmentConversion = calls.length > 0
    ? ((appointmentCalls.length / calls.length) * 100).toFixed(1)
    : "0.0";

  const patientCallData = patients.slice(0, 10).map((p: any) => {
    const patientCalls = calls.filter((c: any) => c.patient?._id === p._id || c.patient === p._id);
    return {
      name: p.name.split(" ")[0],
      calls: patientCalls.length,
      completed: patientCalls.filter((c: any) => c.status === "completed").length,
    };
  });

  const completionRate = calls.length > 0
    ? ((completedCalls.length / calls.length) * 100).toFixed(1)
    : "0.0";

  const responseRate = completedCalls.length > 0
    ? ((completedCalls.filter((c: any) => c.patientResponded === true).length / completedCalls.length) * 100).toFixed(1)
    : "0.0";

  const qaTrends = qaTrendsData?.trends || [];

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportHtml, setReportHtml] = useState("");
  const [reportEditMode, setReportEditMode] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const handleEditInput = useCallback(() => {
    if (editRef.current) {
      setReportHtml(editRef.current.innerHTML);
    }
  }, []);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.post("/patient-portal/generate-monthly-report");
      setReportHtml(res.data.html);
      setShowReportModal(true);
      setReportEditMode(false);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleSendReport = async () => {
    setEmailLoading(true);
    try {
      await api.post("/patient-portal/send-monthly-report", { html: reportHtml });
      toast.success("Report sent to admin email");
      setShowReportModal(false);
    } catch {
      toast.error("Failed to send report");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(reportHtml);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your call operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">{completedCalls.length}/{calls.length} calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
            <Phone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
            <p className="text-xs text-muted-foreground">of completed calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appt. Conversion</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentConversion}%</div>
            <p className="text-xs text-muted-foreground">{appointmentCalls.length} appointments booked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg QA Score</CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaSummary?.averageOverall || "--"}</div>
            <p className="text-xs text-muted-foreground">{qaSummary?.total || 0} calls scored</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSeverity}</div>
            <p className="text-xs text-muted-foreground">out of 10</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Volume & Answer Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={callsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" domain={[0, 100]} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="calls" fill="#3b82f6" radius={[2, 2, 0, 0]} opacity={0.3} />
                  <Line yAxisId="left" type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="answerRate" stroke="#10b981" strokeWidth={2} dot={false} name="Answer Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callOutcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {callOutcomeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calls by Patient (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientCallData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="calls" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {qaSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4" /> QA Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: "averageAccuracy", label: "Accuracy", color: "bg-blue-50 text-blue-700" },
                  { key: "averageEmpathy", label: "Empathy", color: "bg-emerald-50 text-emerald-700" },
                  { key: "averageProfessionalism", label: "Professionalism", color: "bg-purple-50 text-purple-700" },
                  { key: "averageAdherence", label: "Adherence", color: "bg-amber-50 text-amber-700" },
                  { key: "averageResolution", label: "Resolution", color: "bg-red-50 text-red-700" },
                ].map((m) => (
                  <div key={m.key} className="flex items-center justify-between">
                    <span className="text-sm">{m.label}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${m.color}`}>{qaSummary[m.key] || "--"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>QA Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qaTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Avg QA Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{completedCalls.length}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Failed</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{failedCalls.length}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Activity className="h-4 w-4" />
                    <span>In Progress</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{inProgressCalls.length}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Calendar className="h-4 w-4" />
                    <span>Scheduled</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{scheduledCalls.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileDown className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Report</h3>
              <p className="text-xs text-slate-400 mt-0.5">Auto-emailed to admin on the 1st of each month</p>
            </div>
          </div>
          <Button onClick={handleGenerateReport} className="gap-2.5 px-7 py-3 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:scale-[1.02] transition-all duration-200" disabled={reportLoading}>
            <FileDown className="h-4 w-4" /> {reportLoading ? "Generating..." : "Generate Report"}
          </Button>
        </div>
        <div className="px-7 pb-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">This Month's Calls</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{calls.length}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Completed</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCalls.length}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Avg Severity</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{avgSeverity}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Active Patients</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{patients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && reportHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Dark header bar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
                    <FileDown className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Monthly Performance Report</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Review, edit, and share your clinic's report</p>
                  </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <X className="h-4.5 w-4.5 text-slate-300" />
                </button>
              </div>
              {/* Tabs + actions row */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={() => setReportEditMode(false)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${!reportEditMode ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                  ><Eye className="h-4 w-4" /> Preview</button>
                  <button
                    onClick={() => setReportEditMode(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${reportEditMode ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                  ><Edit3 className="h-4 w-4" /> Edit HTML</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200" title="Download as PDF">
                    <FileDown className="h-4 w-4" /> PDF
                  </button>
                  <button onClick={handleSendReport} disabled={emailLoading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed" title="Send via Email">
                    <Send className="h-4 w-4" /> {emailLoading ? "Sending..." : "Send Email"}
                  </button>
                </div>
              </div>
            </div>
            {/* Content area */}
            <div className="flex-1 overflow-auto bg-slate-50 p-6">
              {reportEditMode ? (
                <div ref={editContainerRef} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-red-400" />
                      <span className="h-3 w-3 rounded-full bg-yellow-400" />
                      <span className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium ml-2">HTML Editor</span>
                  </div>
                  <div
                    ref={editRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditInput}
                    className="prose max-w-none p-8 min-h-[500px] outline-none focus:ring-0"
                    dangerouslySetInnerHTML={{ __html: reportHtml }}
                  />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: reportHtml }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedCalls.slice(0, 5).map((call: any) => (
                <div key={call._id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{call.patient?.name || "Patient"}</span>
                    {call.qaScore?.overall && (
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                        call.qaScore.overall >= 80 ? "bg-emerald-100 text-emerald-700" :
                        call.qaScore.overall >= 70 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        QA: {call.qaScore.overall}
                      </span>
                    )}
                    {!call.qaScore?.overall && call.aiSeverityScore && (
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                        call.aiSeverityScore >= 7 ? "bg-red-100 text-red-700" :
                        call.aiSeverityScore >= 4 ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        Sev: {call.aiSeverityScore}/10
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {call.qaScore?.summary || call.aiSummary || "No summary available"}
                  </p>
                </div>
              ))}
              {completedCalls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No completed calls yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointmentCalls.slice(0, 5).map((call: any) => (
                <div key={call._id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{call.patient?.name || "Patient"}</span>
                    <span className="text-xs text-muted-foreground">
                      {call.nextAppointmentDate ? new Date(call.nextAppointmentDate).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{call.nextAppointmentPlace || "No location"}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{call.duration ? `${call.duration}s` : "N/A"}</span>
                  </div>
                </div>
              ))}
              {appointmentCalls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No appointments booked from calls yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
