"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useLatencySeries } from "@/hooks/useMetrics";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

const FUNNEL_LABELS = [
  { key: "p50", label: "Median Latency" },
  { key: "p95", label: "P95 Latency" },
  { key: "p99", label: "P99 Latency" },
];

export default function LatencyChart() {
  const { data } = useLatencySeries("15m");

  const chartData = (() => {
    if (!data?.p95) return [];
    const series = data;
    return series.p95!.map((point: any, i: number) => ({
      time: point.timestamp * 1000,
      p50: series.p50?.[i]?.value ? +(series.p50[i].value * 1000).toFixed(1) : 0,
      p95: +(point.value * 1000).toFixed(1),
      p99: series.p99?.[i]?.value ? +(series.p99![i].value * 1000).toFixed(1) : 0,
    }));
  })();

  // Calculate funnel-style stats
  const latest = chartData[chartData.length - 1];

  return (
    <div className="bg-white rounded-3xl p-5 border border-surface-200 shadow-card card-hover h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-semibold text-gray-900">Service Latency</h3>
        <button className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Funnel stat tabs */}
      <div className="flex gap-0 mb-3 border-b border-surface-200">
        {FUNNEL_LABELS.map((item, idx) => {
          const val = latest ? latest[item.key as keyof typeof latest] : 0;
          const isSelected = idx === 1; // highlight p95
          return (
            <div
              key={item.key}
              className={`flex-1 py-3 px-4 cursor-pointer text-center border-b-2 transition-colors ${
                isSelected
                  ? "border-gray-900 bg-surface-50"
                  : "border-transparent hover:bg-surface-50"
              }`}
            >
              <p className="text-[11px] text-gray-400 font-medium mb-0.5">{item.label}</p>
              <p className={`text-stat-sm ${isSelected ? "text-gray-900" : "text-gray-500"}`}>
                {typeof val === "number" ? `${val.toFixed(0)}ms` : "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="latGradP95" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="latGradP50" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(t) => format(new Date(t), "HH:mm")}
              stroke="#d4d1cc"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}ms`}
              stroke="#d4d1cc"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(t) => format(new Date(t), "HH:mm:ss")}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}ms`,
                name.toUpperCase(),
              ]}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid #ece9e4",
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                padding: "10px 14px",
                fontSize: "12px",
              }}
            />
            <ReferenceLine
              y={2000}
              stroke="#ef4444"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="p50"
              stroke="#c7d2fe"
              strokeWidth={1.5}
              fill="url(#latGradP50)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="p95"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#latGradP95)"
              dot={false}
              activeDot={{ r: 5, stroke: "#6366f1", strokeWidth: 2, fill: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="p99"
              stroke="#a78bfa"
              strokeWidth={1}
              fill="none"
              dot={false}
              strokeDasharray="4 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
