import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const BRAND_COLOR = "#0a7c6f";

interface MiniBarChartProps {
  data: Array<{ name: string; value: number }>;
  color?: string;
  height?: number;
}

export function MiniBarChart({ data, color = BRAND_COLOR, height = 140 }: MiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
        />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface MiniPieChartProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function MiniPieChart({
  data,
  colors = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"],
  height = 140,
  innerRadius = 32,
  outerRadius = 56,
}: MiniPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface MiniLineChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  domain?: [number, number];
}

export function MiniLineChart({
  data,
  dataKey,
  xKey = "date",
  color = BRAND_COLOR,
  height = 140,
  domain = [0, 100],
}: MiniLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 9, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
        />
        <YAxis hide domain={domain} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "#fff" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
