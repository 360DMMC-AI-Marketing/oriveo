import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from "lucide-react";

interface VoiceAgentProps {
  callId?: string;
  patientName?: string;
  language?: string;
  questions?: string[];
  onCallEnd?: () => void;
}

export default function VoiceAgent({ callId, patientName, language = "en", questions = [], onCallEnd }: VoiceAgentProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [status, setStatus] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const agentWsRef = useRef<WebSocket | null>(null);

  const startCall = useCallback(async () => {
    try {
      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      setStatus("Connecting to AI agent...");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/agent-voice`;
      const ws = new WebSocket(wsUrl);
      agentWsRef.current = ws;

      ws.onopen = () => {
        setStatus("Connected. AI agent is ready.");
        setIsCallActive(true);

        ws.send(JSON.stringify({
          type: "start",
          callId: callId || "browser-test",
          patientName: patientName || "Test Patient",
          language,
          questions,
        }));

        startRecording(stream, ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "transcript":
            setTranscript((prev) => [...prev, { role: "user", text: data.text }]);
            break;
          case "response":
            setTranscript((prev) => [...prev, { role: "assistant", text: data.text }]);
            break;
          case "speaking":
            setIsSpeaking(data.speaking);
            break;
          case "audio":
            playAudio(data.data);
            break;
          case "status":
            setStatus(data.message);
            break;
          case "error":
            setStatus(`Error: ${data.message}`);
            break;
          case "end":
            endCall();
            break;
        }
      };

      ws.onerror = () => {
        setStatus("Connection error");
      };

      ws.onclose = () => {
        setStatus("Disconnected");
        setIsCallActive(false);
      };
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    }
  }, [callId, patientName]);

  function startRecording(stream: MediaStream, ws: WebSocket) {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          ws.send(JSON.stringify({ type: "audio", data: base64 }));
        };
        reader.readAsDataURL(event.data);
      }
    };

    mediaRecorder.start(250);
    mediaRecorderRef.current = mediaRecorder;
  }

  function playAudio(base64Data: string) {
    try {
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      audioContextRef.current.decodeAudioData(bytes.buffer, (buffer) => {
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current!.destination);
        source.start(0);
      });
    } catch {
    }
  }

  const endCall = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (agentWsRef.current) {
      agentWsRef.current.send(JSON.stringify({ type: "stop" }));
      agentWsRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsCallActive(false);
    setStatus("Call ended");
    onCallEnd?.();
  }, [onCallEnd]);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          AI Voice Agent
          {patientName && <span className="text-sm text-muted-foreground">- {patientName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4 p-4">
          {!isCallActive ? (
            <Button onClick={startCall} size="lg" className="gap-2">
              <Phone className="h-5 w-5" />
              Start AI Call
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={toggleMute} variant="outline" size="lg">
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button onClick={endCall} variant="destructive" size="lg" className="gap-2">
                <PhoneOff className="h-5 w-5" />
                End Call
              </Button>
            </div>
          )}
        </div>

        {status && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {isCallActive && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSpeaking && <Volume2 className="h-4 w-4 text-blue-500" />}
            {status}
          </div>
        )}

        {transcript.length > 0 && (
          <div className="max-h-80 overflow-y-auto space-y-2 rounded-lg border p-4">
            {transcript.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  entry.role === "assistant"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-900"
                }`}>
                  <p className="text-xs font-medium mb-1">
                    {entry.role === "assistant" ? "AI Agent" : "Patient"}
                  </p>
                  <p>{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
