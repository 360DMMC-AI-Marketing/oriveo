import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Brain, FileText, Stethoscope,
  AlertCircle, CheckCircle, PenLine, Syringe
} from "lucide-react";
import type { LiveNoteData } from "@/hooks/useLiveNote";

interface LiveNotePanelProps {
  note: LiveNoteData | null;
  isLive: boolean;
  isFinal: boolean;
  lastUpdate: number | null;
  patientName?: string;
  onSign?: () => void;
}

function VitalsSummary({ vitals }: { vitals: LiveNoteData["vitals"] }) {
  if (!vitals) return null;
  const items = [
    { label: "BP", value: vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : null },
    { label: "HR", value: vitals.heartRate ? `${vitals.heartRate}` : null, unit: "bpm" },
    { label: "Temp", value: vitals.temperature ? `${vitals.temperature}°F` : null },
    { label: "Weight", value: vitals.weight ? `${vitals.weight}` : null, unit: "kg" },
    { label: "SpO₂", value: vitals.spo2 ? `${vitals.spo2}%` : null },
    { label: "RR", value: vitals.respiratoryRate ? `${vitals.respiratoryRate}` : null, unit: "/min" },
    { label: "Pain", value: vitals.painScore != null ? `${vitals.painScore}/10` : null },
  ].filter((i) => i.value !== null);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          {item.label}: {item.value}{item.unit || ""}
        </span>
      ))}
    </div>
  );
}

function CodeBadges({ codes, type }: { codes?: Array<{ code: string; description: string }>; type: "ICD-10" | "CPT" }) {
  if (!codes || codes.length === 0) return null;
  const color = type === "ICD-10" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{type}</p>
      <div className="flex flex-wrap gap-1.5">
        {codes.map((c, i) => (
          <span key={i} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
            <span className="font-bold">{c.code}</span>
            {c.description}
          </span>
        ))}
      </div>
    </div>
  );
}

function SoapSection({ title, icon, content, color }: { title: string; icon: React.ReactNode; content: string; color: string }) {
  const isEmpty = !content?.trim();
  return (
    <div className={`rounded-lg border p-3 ${isEmpty ? "border-dashed border-gray-200" : ""}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded ${color}`}>{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {isEmpty && <span className="text-xs text-gray-400 italic">Awaiting data...</span>}
      </div>
      {content ? (
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{content}</p>
      ) : (
        <div className="h-8 w-full rounded bg-gray-50 animate-pulse" />
      )}
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ago`;
}

export default function LiveNotePanel({ note, isLive, isFinal, lastUpdate, patientName, onSign }: LiveNotePanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (note) setVisible(true);
  }, [note?.subjective, note?.objective, note?.assessment, note?.plan]);

  const hasContent = note?.subjective || note?.objective || note?.assessment || note?.plan;
  const hasCodes = (note?.suggestedIcd10Codes?.length || 0) > 0 || (note?.suggestedCptCodes?.length || 0) > 0;
  const hasVitals = note?.vitals && Object.values(note.vitals).some((v) => v != null);

  return (
    <Card className={`border-2 ${isLive ? "border-primary/40" : isFinal ? "border-emerald-300" : "border-gray-200"}`}>
      <CardHeader className={`pb-3 flex flex-row items-center justify-between ${isLive ? "bg-primary/5" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isLive ? "bg-primary/20" : isFinal ? "bg-emerald-100" : "bg-gray-100"}`}>
            {isLive ? (
              <Activity className="h-4 w-4 text-primary" />
            ) : isFinal ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <FileText className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {isLive ? "Live Clinical Note" : isFinal ? "Completed Note" : "Clinical Note"}
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
              {isFinal && (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </CardTitle>
            {isLive && (
              <p className="text-xs text-primary/70">
                {patientName ? `Building note for ${patientName} · ` : ""}
                {lastUpdate ? `Updated ${getTimeAgo(lastUpdate)}` : "Waiting for conversation..."}
              </p>
            )}
            {isFinal && (
              <p className="text-xs text-emerald-600">Note finalized. Review and sign below.</p>
            )}
          </div>
        </div>
        <Badge variant={isLive ? "default" : isFinal ? "secondary" : "outline"} className={isLive ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}>
          {isLive ? "Live" : isFinal ? "Complete" : "Waiting"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {!hasContent && !isFinal ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Brain className="h-10 w-10 mb-2 text-gray-300" />
            <p className="text-sm font-medium">Listening to the conversation...</p>
            <p className="text-xs mt-1">The clinical note will appear here as the AI processes the call</p>
            {isLive && (
              <div className="flex items-center gap-1 mt-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <SoapSection
                title="Subjective"
                icon={<PenLine className="h-3.5 w-3.5 text-blue-600" />}
                content={note?.subjective || ""}
                color="bg-blue-100"
              />
              <SoapSection
                title="Objective"
                icon={<Stethoscope className="h-3.5 w-3.5 text-amber-600" />}
                content={note?.objective || ""}
                color="bg-amber-100"
              />
              {hasVitals && <VitalsSummary vitals={note?.vitals} />}
              <SoapSection
                title="Assessment"
                icon={<Brain className="h-3.5 w-3.5 text-violet-600" />}
                content={note?.assessment || ""}
                color="bg-violet-100"
              />
              <SoapSection
                title="Plan"
                icon={note?.plan?.toLowerCase().includes("medication") || note?.plan?.toLowerCase().includes("prescri") ? <Syringe className="h-3.5 w-3.5 text-emerald-600" /> : <Activity className="h-3.5 w-3.5 text-emerald-600" />}
                content={note?.plan || ""}
                color="bg-emerald-100"
              />
            </div>

            {hasCodes && (
              <div className="space-y-2 pt-1">
                <CodeBadges codes={note?.suggestedIcd10Codes} type="ICD-10" />
                <CodeBadges codes={note?.suggestedCptCodes} type="CPT" />
              </div>
            )}

            {note?.callSummary && (
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Summary</p>
                <p className="text-sm text-gray-700">{note.callSummary}</p>
              </div>
            )}

            {note?.gaps && note.gaps.length > 0 && !isFinal && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Information Gaps</p>
                </div>
                <ul className="space-y-1">
                  {note.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isFinal && onSign && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button onClick={onSign} className="gap-1.5">
                  <PenLine className="h-4 w-4" />
                  Sign Clinical Note
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
