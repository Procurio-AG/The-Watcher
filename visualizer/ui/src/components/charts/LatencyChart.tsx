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
import { useLatencySeries, type MetricsRange } from "@/hooks/useMetrics";
import { format } from "date-fns";
import SearchBar from "@/components/shared/SearchBar";

function formatSeconds(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 2000 ? 0 : 1)}s`;
  return `${Math.round(value)}ms`;
}

export default function LatencyChart({ range }: { range: MetricsRange }) {
  const { data } = useLatencySeries(range);

  const chartData = (() => {
    if (!data?.p95) return [];
    return data.p95.map((point: any) => ({
      time: point.timestamp * 1000,
      p95: +(point.value * 1000).toFixed(1),
    }));
  })();

  const peakPoint =
    chartData.length > 0
      ? chartData.reduce((highest, point) => (point.p95 > highest.p95 ? point : highest), chartData[0])
      : null;

  return (
    <div className="mock-panel card-hover flex h-full flex-col p-4">
      <div className="mb-4">
        <h3 className="text-[15px] font-medium tracking-[-0.03em] text-[#69655f]">
          Service Latency (p95)
        </h3>
      </div>

      <div className="min-h-0 flex-1 rounded-[18px] bg-[linear-gradient(180deg,#ffffff_0%,#eff5ff_100%)] px-2 pb-2 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 14, right: 10, bottom: 2, left: -16 }}>
            <defs>
              <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3e84f5" stopOpacity={0.58} />
                <stop offset="58%" stopColor="#75afff" stopOpacity={0.26} />
                <stop offset="100%" stopColor="#72b2f9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid className="chart-grid" strokeDasharray="0" vertical />
            <XAxis
              dataKey="time"
              tickFormatter={(t) => format(new Date(t), "HH:mm")}
              stroke="#d4d8e1"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(v) => formatSeconds(v)}
              stroke="#d4d8e1"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              labelFormatter={(t) => format(new Date(t), "h:mm:ss a")}
              formatter={(value: number) => [formatSeconds(value), "p95 latency"]}
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e8e4dd",
                boxShadow: "0 18px 36px rgba(120, 112, 100, 0.12)",
                padding: "10px 14px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="p95"
              stroke="#3f88f8"
              strokeWidth={3}
              fill="url(#latencyFill)"
              dot={false}
              activeDot={{ r: 6, stroke: "#4c92fb", strokeWidth: 2, fill: "#fff" }}
            />
            {peakPoint ? (
              <ReferenceDot
                x={peakPoint.time}
                y={peakPoint.p95}
                r={4.5}
                fill="#ffffff"
                stroke="#4f95f0"
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{
                  value: formatSeconds(peakPoint.p95),
                  position: "top",
                  offset: 18,
                  fill: "#494844",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium text-[#8d8aa3]">
          What would you like to explore next?
        </p>
        <SearchBar placeholder="What caused the latency spike at checkout?" />
      </div>
    </div>
  );
}
