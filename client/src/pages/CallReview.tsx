import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  Search, Clock, Play, Download, Brain, Star,
  ThumbsUp, ThumbsDown, FileText, Mic,
  AlertTriangle, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function CallReview() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [tab, setTab] = useState("recordings");

  const { data: callsData } = useQuery({
    queryKey: ["calls"],
    queryFn: () => api.get("/calls").then((r) => r.data),
  });

  const { data: qaScoresData } = useQuery({
    queryKey: ["qa-scores"],
    queryFn: () => api.get("/qa/scores").then((r) => r.data),
  });

  const calls = callsData?.calls || [];
  const qaSummary = qaScoresData?.summary;
  const scoredCalls = qaScoresData?.scores || [];
  const completedCalls = calls.filter((c: any) => c.status === "completed");
  const allCalls = calls;

  const filteredCalls = allCalls.filter((c: any) =>
    c.patient?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityColor = (score: number) => {
    if (score >= 7) return "bg-red-100 text-red-700";
    if (score >= 4) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const getQAScore = (call: any) => {
    if (call.qaScore?.overall) return call.qaScore.overall;
    if (!call.aiSummary) return null;
    return Math.min(100, Math.max(60,
      70 + (call.patientResponded ? 10 : 0) + (call.duration > 30 ? 10 : 0) + ((call.aiSeverityScore || 0) > 0 ? 10 : 0)
    ));
  };

  const avgScore = scoredCalls.length > 0
    ? qaSummary?.averageOverall?.toString() || "--"
    : completedCalls.length > 0
      ? (completedCalls.reduce((s: number, c: any) => s + (getQAScore(c) || 0), 0) / completedCalls.length).toFixed(0)
      : "--";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Review</h1>
        <p className="text-muted-foreground">Browse recordings, transcripts, and AI quality scores</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Mic className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{allCalls.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recordings</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCalls.filter((c: any) => c.audioUrl).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg QA Score</CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{avgScore}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedCalls.filter((c: any) => (getQAScore(c) || 0) < 70).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="recordings" className="gap-2"><Mic className="h-4 w-4" /> Recordings</TabsTrigger>
          <TabsTrigger value="qa" className="gap-2"><Brain className="h-4 w-4" /> Quality Scores</TabsTrigger>
          <TabsTrigger value="transcript" className="gap-2"><MessageSquare className="h-4 w-4" /> Transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="recordings" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search calls..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {filteredCalls.filter((c: any) => c.audioUrl).map((call: any) => (
              <div key={call._id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{call.patient?.name || "Unknown"}</span>
                  <Badge variant="outline" className="capitalize">{call.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {call.duration ? `${call.duration}s` : "N/A"}
                  {call.createdAt && ` | ${new Date(call.createdAt).toLocaleDateString()}`}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/calls/${call._id}`)}>
                    <Play className="h-3 w-3" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.error("Audio download not available")}>
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </div>
              </div>
            ))}
            {filteredCalls.filter((c: any) => c.audioUrl).length === 0 && (
              <div className="col-span-2 flex flex-col items-center py-12 text-center">
                <Mic className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-500">No recordings yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="qa" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-5 mb-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Avg Overall</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{qaSummary?.averageOverall || "--"}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Accuracy</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{qaSummary?.averageAccuracy || "--"}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Empathy</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{qaSummary?.averageEmpathy || "--"}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Profession.</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{qaSummary?.averageProfessionalism || "--"}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Resolution</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{qaSummary?.averageResolution || "--"}</div></CardContent></Card>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by patient..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {filteredCalls.filter((c: any) => c.status === "completed").slice(0, 20).map((call: any) => {
              const score = getQAScore(call);
              return (
                <div key={call._id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedCall?._id === call._id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{call.patient?.name || "Unknown"}</span>
                    {score !== null && (
                      <Badge variant={score >= 80 ? "default" : score >= 70 ? "secondary" : "destructive"}>
                        {score}/100
                      </Badge>
                    )}
                  </div>
                  {call.qaScore?.scores && (
                    <div className="flex gap-2 mb-2 text-xs">
                      <span className="text-blue-600">A:{call.qaScore.scores.accuracy}</span>
                      <span className="text-emerald-600">E:{call.qaScore.scores.empathy}</span>
                      <span className="text-purple-600">P:{call.qaScore.scores.professionalism}</span>
                      <span className="text-amber-600">Ad:{call.qaScore.scores.adherence}</span>
                      <span className="text-red-600">R:{call.qaScore.scores.resolution}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {call.duration ? `${call.duration}s` : "N/A"}
                    {call.triageTier !== undefined && call.triageTier !== null && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        call.triageTier === 0 ? "bg-red-100 text-red-700" :
                        call.triageTier === 1 ? "bg-amber-100 text-amber-700" :
                        call.triageTier === 2 ? "bg-blue-100 text-blue-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        T{call.triageTier}
                      </span>
                    )}
                    {call.aiSeverityScore && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(call.aiSeverityScore)}`}>
                        Sev: {call.aiSeverityScore}
                      </span>
                    )}
                    {call.crisisPathwayUsed && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-200 text-red-800">CRISIS</span>
                    )}
                    {call.patientResponded !== null && (
                      call.patientResponded
                        ? <ThumbsUp className="h-3 w-3 text-emerald-500" />
                        : <ThumbsDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  {call.aiSummary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{call.aiSummary}</p>
                  )}
                </div>
              );
            })}
          </div>

          {selectedCall && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Call Details — {selectedCall.patient?.name}
                  {selectedCall.qaScore?.overall && (
                    <Badge variant={selectedCall.qaScore.overall >= 80 ? "default" : selectedCall.qaScore.overall >= 70 ? "secondary" : "destructive"}>
                      QA: {selectedCall.qaScore.overall}/100
                    </Badge>
                  )}
                  {selectedCall.triageTier !== undefined && selectedCall.triageTier !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      selectedCall.triageTier === 0 ? "bg-red-100 text-red-700" :
                      selectedCall.triageTier === 1 ? "bg-amber-100 text-amber-700" :
                      selectedCall.triageTier === 2 ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      Tier {selectedCall.triageTier} —&nbsp;
                      {selectedCall.triageTier === 0 ? "Emergency" :
                       selectedCall.triageTier === 1 ? "Urgent" :
                       selectedCall.triageTier === 2 ? "Routine" : "Stable"}
                    </span>
                  )}
                  {selectedCall.crisisPathwayUsed && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-200 text-red-800">
                      Crisis Pathway
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCall.qaScore?.scores && (
                  <div>
                    <p className="text-sm font-medium mb-2">AI QA Scores</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { key: "accuracy", label: "Accuracy", color: "bg-blue-50" },
                        { key: "empathy", label: "Empathy", color: "bg-emerald-50" },
                        { key: "professionalism", label: "Professionalism", color: "bg-purple-50" },
                        { key: "adherence", label: "Adherence", color: "bg-amber-50" },
                        { key: "resolution", label: "Resolution", color: "bg-red-50" },
                      ].map((m) => (
                        <div key={m.key} className={`${m.color} rounded-lg p-3 text-center`}>
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <p className="text-xl font-bold">{selectedCall.qaScore.scores[m.key]}</p>
                        </div>
                      ))}
                    </div>
                    {selectedCall.qaScore.strengths?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-emerald-600 mb-1">Strengths</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {selectedCall.qaScore.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {selectedCall.qaScore.weaknesses?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-amber-600 mb-1">Areas to Improve</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {selectedCall.qaScore.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                    {selectedCall.qaScore.summary && (
                      <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3 mt-2">{selectedCall.qaScore.summary}</p>
                    )}
                  </div>
                )}
                {selectedCall.redFlags?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1 text-red-600">Red Flags Detected</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCall.redFlags.map((flag: any, i: number) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                          flag.tier === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {flag.keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCall.aiRecommendations && (
                  <div>
                    <p className="text-sm font-medium mb-1">Recommendations</p>
                    <p className="text-sm text-muted-foreground bg-amber-50 rounded-lg p-3">{selectedCall.aiRecommendations}</p>
                  </div>
                )}
                {selectedCall.transcript?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Transcript</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {selectedCall.transcript.map((entry: any, i: number) => (
                        <div key={i} className="rounded-lg border p-2 text-sm">
                          <p className="text-xs font-medium text-blue-600">Q: {entry.question}</p>
                          <p className="text-xs text-gray-600 mt-1">{entry.answer || <span className="italic text-gray-400">No answer</span>}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transcript" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search calls with transcripts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {filteredCalls.filter((c: any) => c.transcript?.length > 0).length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No transcripts yet</p>
              <p className="text-sm text-gray-400">Completed calls with AI analysis will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCalls.filter((c: any) => c.transcript?.length > 0).slice(0, 10).map((call: any) => (
                <div key={call._id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{call.patient?.name || "Unknown"}</span>
                    <span className="text-sm text-muted-foreground">{call.transcript.length} exchanges</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {call.transcript.slice(0, 6).map((entry: any, i: number) => (
                      <div key={i} className="rounded-lg border p-2 text-sm">
                        <p className="text-xs font-medium text-blue-600">Q: {entry.question}</p>
                        <p className="text-xs text-gray-600 mt-1">{entry.answer || <span className="italic text-gray-400">No answer</span>}</p>
                      </div>
                    ))}
                    {call.transcript.length > 6 && (
                      <p className="text-xs text-center text-muted-foreground">+{call.transcript.length - 6} more exchanges</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
