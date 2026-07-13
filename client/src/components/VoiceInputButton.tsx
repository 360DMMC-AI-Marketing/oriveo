import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  language?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function VoiceInputButton({ onResult, language = "en-US", size = "md", className = "" }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSupported(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      if (event.results[0].isFinal) {
        onResult(transcript);
        setListening(false);
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [language, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  if (!supported) return null;

  const sizeClasses = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      className={`${sizeClasses} flex items-center justify-center rounded-lg border transition-colors shrink-0 ${
        listening
          ? "border-red-400 bg-red-50 text-red-600 animate-pulse"
          : "border-gray-300 bg-white text-gray-400 hover:border-gray-400 hover:text-gray-600"
      } ${className}`}
      title={listening ? "Listening..." : "Voice input"}
    >
      {listening ? <Loader2 className={`${iconSize} animate-spin`} /> : <Mic className={iconSize} />}
    </button>
  );
}
