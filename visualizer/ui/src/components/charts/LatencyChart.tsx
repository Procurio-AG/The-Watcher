"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { format } from "date-fns";
import { useLatencySeries, type MetricsRange } from "@/hooks/useMetrics";
import { formatDuration } from "@/lib/utils";

export default function LatencyChart({ range }: { range: MetricsRange }) {
  const { data } = useLatencySeries(range);

  const chartData = (data?.p95 || []).map((point) => ({
    time: point.timestamp * 1000,
    p95: point.value,
  }));

  const peak = chartData.reduce<{ time: number; p95: number } | null>((best, point) => {
    if (!best || point.p95 > best.p95) return point;
    return best;
  }, null);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">Service Latency (p95)</h3>
          <p className="mt-1 text-[12px] text-[#999]">Live backend latency series across the selected time window</p>
        </div>
        <span className="rounded-full bg-[rgba(114,1,255,0.08)] px-3 py-1 text-[11px] font-bold text-[#7201FF]">
          {range}
        </span>
      </div>

      <div className="min-h-0 flex-1" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 18, right: 12, bottom: 4, left: -18 }}>
            <defs>
              <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7201FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7201FF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.04)" vertical={true} strokeDasharray="0" />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => format(new Date(value), "h:mm a")}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#aaa", fontSize: 11 }}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(value) => (value >= 1 ? `${value.toFixed(0)}s` : `${Math.round(value * 1000)}ms`)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#aaa", fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), "h:mm:ss a")}
              formatter={(value: number) => [formatDuration(value), "P95 latency"]}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid rgba(114,1,255,0.15)",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
                padding: "10px 12px",
                fontSize: "12px",
              }}
            />
            {peak ? (
              <ReferenceDot
                x={peak.time}
                y={peak.p95}
                r={4}
                fill="#ffffff"
                stroke="#7201FF"
                strokeWidth={2}
                label={{
                  value: formatDuration(peak.p95),
                  position: "top",
                  fill: "#7201FF",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ) : null}
            <Area type="monotone" dataKey="p95" stroke="#7201FF" strokeWidth={2.5} fill="url(#latencyFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
