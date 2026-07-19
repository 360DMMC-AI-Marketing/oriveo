import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export interface LiveNoteData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnoses?: Array<{ code: string; name: string; laterality?: string }>;
  vitals?: {
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    heartRate?: number | null;
    temperature?: number | null;
    weight?: number | null;
    spo2?: number | null;
    respiratoryRate?: number | null;
    painScore?: number | null;
  };
  suggestedCptCodes?: Array<{ code: string; description: string }>;
  suggestedIcd10Codes?: Array<{ code: string; description: string }>;
  gaps?: string[];
  callSummary?: string;
}

interface NoteUpdateEvent {
  callId: string;
  note: LiveNoteData;
  timestamp: number;
  isFinal: boolean;
}

export function useLiveNote(callId: string | undefined) {
  const [note, setNote] = useState<LiveNoteData | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    if (!callId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-call", callId);

    const handler = (event: NoteUpdateEvent) => {
      if (event.callId === callId) {
        setNote(event.note);
        setIsFinal(event.isFinal);
        setIsLive(!event.isFinal);
        setLastUpdate(event.timestamp);
      }
    };

    socket.on("call:note-update", handler);

    return () => {
      socket.off("call:note-update", handler);
    };
  }, [callId]);

  const reset = useCallback(() => {
    setNote(null);
    setIsFinal(false);
    setIsLive(false);
    setLastUpdate(null);
  }, []);

  return { note, isFinal, isLive, lastUpdate, reset };
}
