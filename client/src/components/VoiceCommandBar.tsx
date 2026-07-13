import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Command, Loader2 } from "lucide-react";

interface Command {
  pattern: RegExp;
  route?: string;
  action?: () => void;
  label: string;
}

const COMMANDS: Command[] = [
  { pattern: /^(go to|open|navigate to|show)\s+(dashboard|home)$/i, route: "/dashboard", label: "Go to Dashboard" },
  { pattern: /^(go to|open|navigate to|show)\s+(patients?|patient list)$/i, route: "/patients", label: "Go to Patients" },
  { pattern: /^(go to|open|navigate to|show)\s+(appointments?|calendar|schedule)$/i, route: "/appointments", label: "Go to Appointments" },
  { pattern: /^(go to|open|navigate to|show)\s+(call center|voice agent|make a call)$/i, route: "/voice-agent", label: "Go to Call Center" },
  { pattern: /^(go to|open|navigate to|show)\s+(inbound calls?|incoming)/i, route: "/inbound-calls", label: "Go to Inbound Calls" },
  { pattern: /^(go to|open|navigate to|show)\s+(call review|reports?|completed calls)/i, route: "/call-review", label: "Go to Call Review" },
  { pattern: /^(go to|open|navigate to|show)\s+(analytics?|statistics?|stats)/i, route: "/analytics", label: "Go to Analytics" },
  { pattern: /^(go to|open|navigate to|show)\s+(settings|config|configuration)/i, route: "/clinic/settings", label: "Go to Settings" },
  { pattern: /^(go to|open|navigate to|show)\s+(users?|team|staff)/i, route: "/clinic/users", label: "Go to Users" },
  { pattern: /^(go to|open|navigate to|show)\s+(knowledge base|kb|documents)/i, route: "/knowledge-base", label: "Go to Knowledge Base" },
  { pattern: /^(go to|open|navigate to|show)\s+(templates?|questionnaires?)/i, route: "/templates", label: "Go to Templates" },
  { pattern: /^(go to|open|navigate to|show)\s+(live monitoring|supervisor|monitor)/i, route: "/live-monitoring", label: "Go to Live Monitoring" },
  { pattern: /^(go to|open|navigate to|show)\s+(notifications?|alerts?)/i, route: "/notifications", label: "Go to Notifications" },
  { pattern: /^(go to|open|navigate to|show)\s+(guide|onboarding|help|tour)/i, action: () => window.dispatchEvent(new CustomEvent("opencode-show-tour")), label: "Show Onboarding Tour" },
  { pattern: /^(go to|open|navigate to|show)\s+(audit log|audit)$/i, route: "/audit-log", label: "Go to Audit Log" },
  { pattern: /^search\s+patient\s+(.+)/i, route: "/patients?search=$1", label: "Search Patient" },
  { pattern: /^(call|dial|phone)\s+(.+)/i, route: "/voice-agent", label: "Call patient" },
  { pattern: /^(scroll up|up)$/i, action: () => window.scrollBy(0, -300), label: "Scroll up" },
  { pattern: /^(scroll down|down)$/i, action: () => window.scrollBy(0, 300), label: "Scroll down" },
  { pattern: /^(go back|back|previous)$/i, action: () => window.history.back(), label: "Go back" },
];

export default function VoiceCommandBar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((p) => !p);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);

      if (event.results[0].isFinal) {
        recognition.stop();
        executeCommand(text);
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setTranscript("");
    setFeedback(null);
    recognition.start();
    setListening(true);
  }, [navigate]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  function executeCommand(text: string) {
    for (const cmd of COMMANDS) {
      const match = text.match(cmd.pattern);
      if (match) {
        if (cmd.route) {
          const route = cmd.route.replace("$1", encodeURIComponent(match[1] || ""));
          navigate(route);
          setFeedback({ message: `Navigated: ${cmd.label}`, success: true });
        } else if (cmd.action) {
          cmd.action();
          setFeedback({ message: `Executed: ${cmd.label}`, success: true });
        }
        setTimeout(() => setIsOpen(false), 1500);
        return;
      }
    }
    setFeedback({ message: `Command not recognized: "${text}"`, success: false });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all"
        title="Voice Commands (Ctrl+K)"
      >
        <Mic className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-lg mx-4 rounded-xl border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${listening ? "bg-red-100" : "bg-gray-100"}`}>
            {listening ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Command className="h-4 w-4 text-gray-500" />}
          </div>
          <div className="flex-1">
            {listening ? (
              <p className="text-sm font-medium text-gray-900">Listening... "{transcript}"</p>
            ) : feedback ? (
              <p className={`text-sm font-medium ${feedback.success ? "text-emerald-600" : "text-red-600"}`}>{feedback.message}</p>
            ) : (
              <p className="text-sm text-gray-500">Say a command — <span className="text-xs text-gray-400">try "go to patients", "search patient John", "scroll down"</span></p>
            )}
          </div>
          <button onClick={listening ? stopListening : startListening}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${listening ? "border-red-400 bg-red-50 text-red-600 animate-pulse" : "border-gray-300 hover:bg-gray-50 text-gray-500"}`}>
            {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">ESC</button>
        </div>
        <div className="max-h-60 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[10px] font-medium uppercase text-gray-400 tracking-wider">Available commands</p>
          <div className="grid grid-cols-2 gap-1">
            {COMMANDS.map((cmd, i) => (
              <div key={i} className="rounded px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50">{cmd.label}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
