import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, RefreshCw, Check, SwitchCamera } from "lucide-react";

type Props = {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
};

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera not available on this device/browser.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError("Could not access the camera. Check browser permission.");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL("image/jpeg", 0.85));
  };

  const retake = () => setPreview(null);

  const confirm = () => {
    if (preview) onCapture(preview);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Take a photo</h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
        {preview ? (
          <img src={preview} alt="captured" className="w-full h-full object-contain" />
        ) : (
          <video ref={videoRef} playsInline muted className="w-full h-full object-contain" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {!preview && (
          <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-xl pointer-events-none m-4" />
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {!preview ? (
          <>
            <Button type="button" variant="outline" onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} title="Switch camera">
              <SwitchCamera size={16} className="mr-1" /> Switch
            </Button>
            <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={capture}>
              <Camera size={16} className="mr-1" /> Capture
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={retake}>
              <RefreshCw size={16} className="mr-1" /> Retake
            </Button>
            <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirm}>
              <Check size={16} className="mr-1" /> Use Photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
