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
      className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-3 transition-all duration-200 hover:shadow-md hover:border-gray-200"
      style={{
        background: `linear-gradient(135deg, ${accent}08 0%, ${accent}03 50%, white 100%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: accent + "15" }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        {sub && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-lg font-bold tracking-tight text-gray-900">
        {value}
        {trend && (
          <span className={`ml-1.5 text-xs ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
            {trend === "up" ? "↗" : "↘"}
          </span>
        )}
      </p>
      <p className="text-[11px] text-gray-500 truncate">{label}</p>
    </div>
  );
}
