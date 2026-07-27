import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ icon: Icon, label, value, sub, accent, trend }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-gray-200"
      style={{
        background: `linear-gradient(135deg, ${accent}08 0%, ${accent}03 50%, white 100%)`,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: accent + "15" }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        {sub && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className="text-xs text-gray-500">{label}</p>
        {trend === "up" && (
          <span className="text-[10px] font-medium text-emerald-600">↗</span>
        )}
        {trend === "down" && (
          <span className="text-[10px] font-medium text-red-500">↘</span>
        )}
      </div>
      <div
        className="absolute bottom-0 left-0 h-1 w-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}
