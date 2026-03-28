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
        <h3 className="text-[14px] font-medium text-[color:var(--text-secondary)]">Service Latency (p95)</h3>
      </div>

      {chartData.length > 0 ? (
        <div style={{ height: 230 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 18, right: 10, bottom: 0, left: -16 }}>
              <defs>
                <pattern id="latencyStripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
                  <rect width="8" height="8" fill="#4b90ff" fillOpacity="0.2" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#4b90ff" strokeWidth="2" />
                </pattern>
                <linearGradient id="latencyFillBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b90ff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#4b90ff" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="0" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => format(new Date(value), "h:mm a")}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={(value) => (value >= 1 ? `${value.toFixed(0)}s` : `${Math.round(value * 1000)}ms`)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), "h:mm:ss a")}
                formatter={(value: number) => [formatLatency(value), "Latency"]}
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid var(--tooltip-border)",
                  background: "var(--tooltip-bg)",
                  boxShadow: "var(--tooltip-shadow)",
                  padding: "10px 12px",
                  fontSize: "12px",
                }}
              />
              {peak ? (
                <ReferenceDot
                  x={peak.time}
                  y={peak.p95}
                  r={4}
                  fill="var(--card-bg)"
                  stroke="#5b9cf7"
                  strokeWidth={2}
                  label={{
                    value: formatLatency(peak.p95),
                    position: "top",
                    fill: "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              ) : null}
              <Area type="monotone" dataKey="p95" stroke="#4b90ff" strokeWidth={3} fill="url(#latencyFillBlue)" />
              <Area type="monotone" dataKey="p95" stroke="transparent" fill="url(#latencyStripes)" fillOpacity={0.35} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="dashboard-empty-state h-[230px] rounded-[22px] border border-dashed border-[color:var(--card-border)]">
          No latency series are available for this range yet.
        </div>
      )}
    </div>
  );
}
