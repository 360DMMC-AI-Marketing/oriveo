import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, CheckCircle2, XCircle, AlertTriangle, Brain,
  ThumbsUp, ThumbsDown, MessageSquare, Clock, Filter, Star, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AIQA() {
  const [search, setSearch] = useState("");
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: callsData } = useQuery({
    queryKey: ["calls"],
    queryFn: () => api.get("/calls").then((r) => r.data),
  });

  const { data: qaScoresData } = useQuery({
    queryKey: ["qa-scores"],
    queryFn: () => api.get("/qa/scores").then((r) => r.data),
  });

  const scoreMutation = useMutation({
    mutationFn: (callId: string) => api.post(`/qa/score/${callId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa-scores"] });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      toast.success("Call scored successfully");
    },
    onError: () => toast.error("Failed to score call"),
  });

  const batchScoreMutation = useMutation({
    mutationFn: () => api.post("/qa/score-all"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["qa-scores"] });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      toast.success(`${data.data.scored} calls scored`);
    },
    onError: () => toast.error("Failed to batch score"),
  });

  const calls = callsData?.calls || [];
  const qaSummary = qaScoresData?.summary;
  const scoredCalls = qaScoresData?.scores || [];
  const completedCalls = calls.filter((c: any) => c.status === "completed");

  const filteredCalls = completedCalls.filter((c: any) =>
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

  const needsScore = completedCalls.filter((c: any) => !c.qaScore?.overall).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Quality Assurance</h1>
        <p className="text-muted-foreground">
          Review and score AI voice agent performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scored</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scoredCalls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg QA Score</CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaSummary?.averageOverall || "--"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Quality (80+)</CardTitle>
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scoredCalls.filter((c: any) => c.qaScore?.overall >= 80).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review (&lt;70)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scoredCalls.filter((c: any) => c.qaScore?.overall < 70).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Scoring</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsScore}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {qaSummary && (
            <span>Overall: {qaSummary.averageOverall} | Acc: {qaSummary.averageAccuracy} | Emp: {qaSummary.averageEmpathy} | Prof: {qaSummary.averageProfessionalism} | Adh: {qaSummary.averageAdherence} | Res: {qaSummary.averageResolution}</span>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => batchScoreMutation.mutate()}
          disabled={batchScoreMutation.isPending || needsScore === 0}
        >
          <RefreshCw className={`h-4 w-4 ${batchScoreMutation.isPending ? "animate-spin" : ""}`} />
          Score All Unsorted
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {filteredCalls.slice(0, 20).map((call: any) => {
                const score = getQAScore(call);
                return (
                  <div
                    key={call._id}
                    className={`rounded-lg border p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedCall?._id === call._id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{call.patient?.name || "Unknown"}</span>
                      {score !== null && (
                        <Badge variant={score >= 80 ? "default" : score >= 70 ? "secondary" : "destructive"}>
                          {score}/100
                        </Badge>
                      )}
                      {!call.qaScore?.overall && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); scoreMutation.mutate(call._id); }} disabled={scoreMutation.isPending}>
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {call.qaScore?.scores && (
                      <div className="flex gap-2 mb-1 text-xs">
                        <span className="text-blue-600">A:{call.qaScore.scores.accuracy}</span>
                        <span className="text-emerald-600">E:{call.qaScore.scores.empathy}</span>
                        <span className="text-purple-600">P:{call.qaScore.scores.professionalism}</span>
                        <span className="text-amber-600">Ad:{call.qaScore.scores.adherence}</span>
                        <span className="text-red-600">R:{call.qaScore.scores.resolution}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {call.duration ? `${call.duration}s` : "N/A"}
                      {call.aiSeverityScore && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(call.aiSeverityScore)}`}>
                          Severity: {call.aiSeverityScore}
                        </span>
                      )}
                      {call.patientResponded !== null && (
                        call.patientResponded
                          ? <ThumbsUp className="h-3 w-3 text-emerald-500" />
                          : <ThumbsDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    {call.qaScore?.summary && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{call.qaScore.summary}</p>
                    )}
                  </div>
                );
              })}
              {filteredCalls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No calls found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCall ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{selectedCall.patient?.name || "Unknown Patient"}</h3>
                  {selectedCall.qaScore?.overall && (
                    <Badge variant={selectedCall.qaScore.overall >= 80 ? "default" : selectedCall.qaScore.overall >= 70 ? "secondary" : "destructive"}>
                      QA: {selectedCall.qaScore.overall}/100
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">{selectedCall.status}</Badge>
                  <Badge variant="outline">{selectedCall.duration ? `${selectedCall.duration}s` : "No duration"}</Badge>
                  {selectedCall.patientResponded !== null && (
                    <Badge variant={selectedCall.patientResponded ? "default" : "destructive"}>
                      {selectedCall.patientResponded ? "Answered" : "No Answer"}
                    </Badge>
                  )}
                  {!selectedCall.qaScore?.overall && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => scoreMutation.mutate(selectedCall._id)} disabled={scoreMutation.isPending}>
                      <Brain className="h-3 w-3" /> Score with AI
                    </Button>
                  )}
                </div>

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
                  </div>
                )}

                {selectedCall.qaScore?.summary && (
                  <div>
                    <p className="text-sm font-medium mb-1">QA Summary</p>
                    <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">{selectedCall.qaScore.summary}</p>
                  </div>
                )}

                {selectedCall.aiSummary && !selectedCall.qaScore?.summary && (
                  <div>
                    <p className="text-sm font-medium mb-1">AI Summary</p>
                    <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                      {selectedCall.aiSummary}
                    </p>
                  </div>
                )}

                {selectedCall.aiRecommendations && (
                  <div>
                    <p className="text-sm font-medium mb-1">Recommendations</p>
                    <p className="text-sm text-muted-foreground bg-amber-50 rounded-lg p-3">
                      {selectedCall.aiRecommendations}
                    </p>
                  </div>
                )}

                {selectedCall.transcript && selectedCall.transcript.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Transcript ({selectedCall.transcript.length} entries)</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {selectedCall.transcript.map((entry: any, i: number) => (
                        <div key={i} className="rounded-lg border p-2 text-sm">
                          <p className="text-xs font-medium text-blue-600">Q: {entry.question}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {entry.answer ? `A: ${entry.answer}` : <span className="italic text-gray-400">No answer</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedCall.transcript?.length && !selectedCall.aiSummary && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No detailed transcript or summary available for this call
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-500">Select a call to review</p>
                <p className="text-sm text-gray-400">
                  Choose a call from the list to view its QA details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
