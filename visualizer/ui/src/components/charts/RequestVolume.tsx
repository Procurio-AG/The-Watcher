"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useRequestSeries, type MetricsRange } from "@/hooks/useMetrics";
import { formatNumber } from "@/lib/utils";

export default function RequestVolume({ range }: { range: MetricsRange }) {
  const { data } = useRequestSeries(range);

  const totals = new Map<number, number>();
  (data || []).forEach((series) => {
    (series.values || []).forEach((point) => {
      const key = point.timestamp * 1000;
      totals.set(key, (totals.get(key) || 0) + point.value);
    });
  });

  const chartData = Array.from(totals.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-12)
    .map(([time, volume]) => ({ time, volume }));

  const latest = chartData[chartData.length - 1]?.volume || 0;

  return (
    <div className="dashboard-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[#4f4f4f]">Request Volume</h3>
          <p className="mt-1 text-[12px] text-[#999]">Aggregate requests per second</p>
        </div>
        <span className="text-[28px] font-semibold tracking-[-0.05em] text-[#1a1a1a]">{formatNumber(latest)}</span>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7caeff" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#cfe2ff" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eeeae5" vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => format(new Date(value), "HH:mm")}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9a9a9a", fontSize: 10 }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9a9a9a", fontSize: 10 }} />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), "h:mm:ss a")}
              formatter={(value: number) => [`${value.toFixed(2)} req/s`, "Volume"]}
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #ebe8e3",
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
                padding: "10px 12px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="volume" fill="url(#requestsFill)" radius={[10, 10, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
