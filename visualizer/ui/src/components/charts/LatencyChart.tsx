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

function formatLatency(value: number) {
  if (value >= 1) return `${value.toFixed(1)}s`;
  return `${Math.round(value * 1000)}ms`;
}

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
      <div className="mb-3">
        <h3 className="text-[15px] font-medium text-[#6a6a6a]">Service Latency (p95)</h3>
      </div>

      <div className="min-h-0 flex-1" style={{ minHeight: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 18, right: 10, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="latencyFillBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#79b7ff" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#79b7ff" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eeeae5" strokeDasharray="0" />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => format(new Date(value), "h:mm a")}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a2a2a2", fontSize: 11 }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(value) => (value >= 1 ? `${value.toFixed(0)}s` : `${Math.round(value * 1000)}ms`)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a2a2a2", fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), "h:mm:ss a")}
              formatter={(value: number) => [formatLatency(value), "Latency"]}
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #ebe7e0",
                background: "rgba(255,255,255,0.98)",
                boxShadow: "0 14px 28px rgba(0,0,0,0.08)",
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
                stroke="#5b9cf7"
                strokeWidth={2}
                label={{
                  value: formatLatency(peak.p95),
                  position: "top",
                  fill: "#5a5a5a",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ) : null}
            <Area type="monotone" dataKey="p95" stroke="#5b9cf7" strokeWidth={3} fill="url(#latencyFillBlue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
