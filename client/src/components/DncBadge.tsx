import { Ban } from "lucide-react";

export default function DncBadge({ reason }: { reason?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700 shrink-0"
      title={reason ? `Do Not Call: ${reason}` : "Do Not Call — this patient will not be called"}
    >
      <Ban className="h-3 w-3" /> DNC
    </span>
  );
}
