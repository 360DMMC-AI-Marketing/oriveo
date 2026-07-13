import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Phone, AlertTriangle, Clock, CheckCircle,
  Headphones, Siren, Brain, User, ChevronDown, ChevronRight,
  PhoneIncoming, PhoneOutgoing
} from "lucide-react";

interface ActiveCall {
  callId: string;
  callSid: string;
  startedAt: number;
  duration: number;
  patient: { _id: string; name: string; phone: string } | null;
  status: string;
  direction: string;
  language: string;
  severity: number | null;
  lastTranscript: { question?: string; answer?: string } | null;
}

interface TranscriptEvent {
  callId: string;
  role: "patient" | "ai";
  text: string;
  timestamp: number;
}

interface SeverityEvent {
  callId: string;
  tier: number;
  from: number;
  isCrisis: boolean;
  timestamp: number;
}

const callTranscripts: Record<string, TranscriptEvent[]> = {};
const callSeverities: Record<string, number> = {};

export default function LiveMonitoring() {
  const [expandedCalls, setExpandedCalls] = useState<Record<string, boolean>>({});
  const [liveTranscripts, setLiveTranscripts] = useState<Record<string, TranscriptEvent[]>>({});
  const [liveSeverities, setLiveSeverities] = useState<Record<string, number>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["active-calls"],
    queryFn: () => api.get("/calls/active").then((r) => r.data),
    refetchInterval: 5000,
  });

  const activeCalls: ActiveCall[] = data?.activeCalls || [];

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-supervisor");

    const handleTranscript = (event: TranscriptEvent) => {
      const { callId } = event;
      if (!callTranscripts[callId]) callTranscripts[callId] = [];
      callTranscripts[callId].push(event);
      if (callTranscripts[callId].length > 50) callTranscripts[callId].shift();
      setLiveTranscripts({ ...callTranscripts });
    };

    const handleSeverity = (event: SeverityEvent) => {
      callSeverities[event.callId] = event.tier;
      setLiveSeverities({ ...callSeverities });
    };

    socket.on("call:transcript", handleTranscript);
    socket.on("call:severity", handleSeverity);

    return () => {
      socket.emit("leave-supervisor");
      socket.off("call:transcript", handleTranscript);
      socket.off("call:severity", handleSeverity);
    };
  }, []);

  const toggleExpand = (callId: string) => {
    setExpandedCalls((prev) => ({ ...prev, [callId]: !prev[callId] }));
  };

  const getSeverityColor = (severity: number | null) => {
    if (severity === null) return "text-gray-400";
    if (severity <= 2) return "text-emerald-600";
    if (severity <= 5) return "text-amber-600";
    return "text-red-600";
  };

  const getSeverityBg = (severity: number | null) => {
    if (severity === null) return "bg-gray-100";
    if (severity <= 2) return "bg-emerald-50 border-emerald-200";
    if (severity <= 5) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const formatDuration = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getTranscriptsForCall = (callId: string) => {
    return liveTranscripts[callId] || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Monitoring</h1>
          <p className="text-gray-500">Real-time view of all active AI calls</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1.5 gap-1.5">
            <Activity className="h-4 w-4" />
            {activeCalls.length} Active
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Loading active calls...</p>
      ) : activeCalls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Headphones className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No active calls</p>
            <p className="text-sm text-gray-400 mt-1">Active AI calls will appear here in real-time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeCalls.map((call) => {
            const isExpanded = expandedCalls[call.callId];
            const severity = liveSeverities[call.callId] ?? call.severity;
            const transcripts = getTranscriptsForCall(call.callId);
            const lastTranscript = transcripts.length > 0
              ? transcripts[transcripts.length - 1]
              : null;

            return (
              <Card key={call.callId} className={`border-l-4 ${getSeverityBg(severity)}`}>
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleExpand(call.callId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        call.direction === "inbound" ? "bg-blue-100" : "bg-primary-light"
                      }`}>
                        {call.direction === "inbound"
                          ? <PhoneIncoming className="h-5 w-5 text-blue-600" />
                          : <PhoneOutgoing className="h-5 w-5 text-primary" />
                        }
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {call.patient?.name || "Unknown Patient"}
                          </span>
                          <span className={`text-xs font-medium ${getSeverityColor(severity)}`}>
                            {severity != null ? `Severity: ${severity}` : "Severity: —"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration)}
                          </span>
                          <span className="capitalize">{call.direction}</span>
                          <span>{call.language.toUpperCase()}</span>
                          {lastTranscript && (
                            <span className="truncate max-w-[300px] text-gray-400">
                              &ldquo;{lastTranscript.text.substring(0, 80)}...&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Link to={`/calls/${call.callId}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Phone className="h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-3">
                      {transcripts.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                          <Brain className="h-4 w-4" />
                          <span>Waiting for transcript data...</span>
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {transcripts.map((t, i) => (
                            <div key={i} className={`flex items-start gap-2 text-sm p-2 rounded ${
                              t.role === "ai" ? "bg-primary/5" : "bg-gray-50"
                            }`}>
                              <span className={`shrink-0 font-bold text-xs uppercase ${
                                t.role === "ai" ? "text-primary" : "text-gray-500"
                              }`}>
                                {t.role === "ai" ? "AI" : "P"}
                              </span>
                              <span className="text-gray-700">{t.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {call.patient && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-2">
                          <User className="h-3 w-3" />
                          <span>{call.patient.name} &middot; {call.patient.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
