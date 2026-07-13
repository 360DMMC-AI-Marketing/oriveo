import { useState, useRef } from "react";
import api from "@/lib/api";
import { Loader2, Send, Stethoscope, BookOpen, X } from "lucide-react";

interface ClinicalAssistantProps {
  patientId?: string;
  callId?: string;
  onClose?: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function ClinicalAssistant({ patientId, callId, onClose }: ClinicalAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ask me anything about clinical guidelines, symptoms, medications, or treatment protocols." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await api.post("/clinical/query", { question, patientId, callId });
      const data = res.data;
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that question. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Clinical Assistant</h3>
              <p className="text-xs text-gray-400">Evidence-based decision support</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3 min-h-[300px] max-h-[60vh]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-gray-100 text-gray-800 rounded-bl-md"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
                    <BookOpen className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{msg.sources.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t border-gray-200">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a clinical question..."
            className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-40 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
