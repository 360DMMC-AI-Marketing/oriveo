import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VoiceInputButton from "@/components/VoiceInputButton";
import {
  Search, Clock, CheckCircle, XCircle,
  PhoneIncoming, ArrowRight, Siren,
  FileText, Brain, Star, Headphones
} from "lucide-react";

export default function InboundCalls() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: callsData } = useQuery({
    queryKey: ["calls", "inbound"],
    queryFn: () => api.get("/calls?direction=inbound").then((r) => r.data),
  });

  const calls = callsData?.calls || [];

  const filtered = calls.filter((c: any) => {
    const name = c.patient?.name || "Unknown";
    const phone = c.patient?.phone || "";
    const s = search.toLowerCase();
    return name.toLowerCase().includes(s) || phone.includes(s);
  });

  const isUnansweredTab = tab === "unanswered";
  const isAnswered = (c: any) => c.patientResponded === true;
  const isUnanswered = (c: any) => c.patientResponded === false || c.status === "failed";
  const isEmergency = (c: any) => c.emergencyDetected || (c.aiSeverityScore || 0) >= 7;

  const tabCalls = (() => {
    switch (tab) {
      case "answered": return filtered.filter(isAnswered);
      case "unanswered": return filtered.filter(isUnanswered);
      case "emergency": return filtered.filter(isEmergency);
      default: return filtered;
    }
  })();

  const getStatusBadge = (call: any) => {
    if (call.emergencyDetected) {
      return <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1"><Siren className="h-3 w-3" /> Emergency</Badge>;
    }
    switch (call.status) {
      case "completed": return <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case "in-progress": return <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case "failed": return <Badge className="bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      case "transferred": return <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1"><Headphones className="h-3 w-3" /> Transferred</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700">{call.status}</Badge>;
    }
  };

  const getQAScore = (call: any) => {
    if (call.qaScore?.overall) return call.qaScore.overall;
    if (!call.aiSummary) return null;
    return Math.min(100, Math.max(60,
      70 + (call.patientResponded ? 10 : 0) + (call.duration > 30 ? 10 : 0) + ((call.aiSeverityScore || 0) > 0 ? 10 : 0)
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PhoneIncoming className="h-6 w-6 text-primary" />
            Inbound Calls
          </h1>
          <p className="text-gray-500">Calls received from patients calling into the clinic</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Call History</CardTitle>
            <div className="relative flex-1 max-w-xs flex gap-2 items-center justify-end">
              <div className="relative flex-1 max-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <VoiceInputButton onResult={(text) => setSearch(text)} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
              <TabsTrigger value="answered">Answered ({filtered.filter(isAnswered).length})</TabsTrigger>
              <TabsTrigger value="unanswered">Unanswered ({filtered.filter(isUnanswered).length})</TabsTrigger>
              <TabsTrigger value="emergency" className="text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                Emergency ({filtered.filter(isEmergency).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            {tabCalls.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <PhoneIncoming className="mx-auto h-10 w-10 mb-2" />
                <p className="text-sm">No inbound calls found</p>
                <p className="text-xs mt-1">When patients call the clinic number, they will appear here</p>
              </div>
            ) : (
              tabCalls.map((call: any) => (
                <Link
                  key={call._id}
                  to={`/calls/${call._id}`}
                  className="block rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Row 1: Avatar + Name/Status + Arrow */}
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      call.emergencyDetected ? "bg-red-100" :
                      isAnswered(call) ? "bg-emerald-100" :
                      call.status === "in-progress" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      {call.emergencyDetected ? (
                        <Siren className="h-5 w-5 text-red-600" />
                      ) : (
                        <PhoneIncoming className={`h-5 w-5 ${
                          isAnswered(call) ? "text-emerald-600" :
                          call.status === "in-progress" ? "text-blue-600" : "text-gray-400"
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {call.patient?.name || "Unknown Caller"}
                        </span>
                        {getStatusBadge(call)}
                        {!isUnansweredTab && call.aiSeverityScore && (
                          <span className={`text-xs font-medium ${
                            call.aiSeverityScore >= 7 ? "text-red-600" :
                            call.aiSeverityScore >= 4 ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {call.aiSeverityScore}/10
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 flex-wrap">
                        <span>{call.patient?.phone || "No caller ID"}</span>
                        <span>&middot;</span>
                        <span>{new Date(call.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {call.emergencyActionTaken !== "none" && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-1">
                          {call.emergencyActionTaken === "called_911" ? "911 Called" :
                           call.emergencyActionTaken === "called_clinic" ? "Clinic Called" : "Action Taken"}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>

                  {/* Row 2: Extra details (only for answered + non-unanswered tabs) */}
                  {!isUnansweredTab && (
                    <div className="mt-2 ml-13 pl-13 border-t border-gray-100 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                      {call.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                        </div>
                      )}
                      {call.transcript && call.transcript.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-gray-400" />
                          <span>{call.transcript.length} Q&A</span>
                        </div>
                      )}
                      {getQAScore(call) && (
                        <div className="flex items-center gap-1">
                          <Star className={`h-3 w-3 ${
                            (getQAScore(call) || 0) >= 85 ? "text-emerald-500" :
                            (getQAScore(call) || 0) >= 70 ? "text-amber-500" : "text-gray-400"
                          }`} />
                          <span>{getQAScore(call)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 3: AI Summary (only for answered + non-unanswered) */}
                  {!isUnansweredTab && call.aiSummary && (
                    <div className="mt-1.5 ml-13 pl-13 flex items-start gap-1.5">
                      <Brain className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-500 line-clamp-2">{call.aiSummary}</p>
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
