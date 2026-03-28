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
    <div className="glass-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-[color:var(--text-primary)]">Request Volume</h3>
          <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">Aggregate requests per second</p>
        </div>
        <span className="text-[48px] font-semibold tracking-[-0.05em] text-[color:var(--text-primary)]">{formatNumber(latest)}</span>
      </div>

      {chartData.length > 0 ? (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
              <defs>
                <pattern id="requestsStripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
                  <rect width="8" height="8" fill="#35c94b" fillOpacity="0.7" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#2fb646" strokeWidth="2" />
                </pattern>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => format(new Date(value), "HH:mm")}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 10 }} />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), "h:mm:ss a")}
                formatter={(value: number) => [`${value.toFixed(2)} req/s`, "Volume"]}
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid var(--tooltip-border)",
                  background: "var(--tooltip-bg)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "var(--tooltip-shadow)",
                  padding: "10px 12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="volume" fill="url(#requestsStripes)" radius={[8, 8, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="dashboard-empty-state flex-1 rounded-[20px] border border-dashed border-[color:var(--card-border)]">
          No request volume data is available for this range.
        </div>
      )}
    </div>
  );
}
