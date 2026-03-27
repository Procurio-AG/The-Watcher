"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useErrorSeries } from "@/hooks/useMetrics";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

const COLORS = [
  { stroke: "#ef4444", fill: "#fecaca" },
  { stroke: "#f97316", fill: "#fed7aa" },
  { stroke: "#eab308", fill: "#fef08a" },
  { stroke: "#22c55e", fill: "#bbf7d0" },
  { stroke: "#3b82f6", fill: "#bfdbfe" },
];

export default function ErrorChart() {
  const { data } = useErrorSeries("15m");

  const timeMap = new Map<number, Record<string, number>>();
  (data || []).forEach((series: any) => {
    (series.values || []).forEach((p: any) => {
      const ts = p.timestamp * 1000;
      if (!timeMap.has(ts)) timeMap.set(ts, { time: ts });
      timeMap.get(ts)![series.service] = p.value;
    });
  });
  const chartData = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  const services = (data || []).map((s: any) => s.service);

  const totalAvg =
    chartData.length > 0
      ? (
          chartData.reduce(
            (sum, d) => sum + services.reduce((s: number, svc: string) => s + (d[svc] || 0), 0),
            0
          ) / chartData.length
        ).toFixed(1)
      : "0";

  return (
    <div className="bg-white rounded-3xl p-4 border border-surface-200 shadow-card card-hover h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold text-gray-900">Service Errors</h3>
        <button className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <p className="text-stat text-gray-900 mb-4">{totalAvg}%</p>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
            <defs>
              {services.map((svc: string, i: number) => (
                <linearGradient key={svc} id={`errGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length].fill} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length].fill} stopOpacity={0.05} />
                </linearGradient>
              ))}
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
            <YAxis stroke="#d4d1cc" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              labelFormatter={(t) => format(new Date(t), "HH:mm:ss")}
              formatter={(value: number) => [`${value.toFixed(2)}%`]}
              contentStyle={{ borderRadius: "14px", border: "1px solid #ece9e4", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", padding: "10px 14px", fontSize: "12px" }}
            />
            {services.map((svc: string, i: number) => (
              <Area
                key={svc}
                type="monotone"
                dataKey={svc}
                stackId="1"
                stroke={COLORS[i % COLORS.length].stroke}
                strokeWidth={1.5}
                fill={`url(#errGrad${i})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with striped bars */}
      <div className="mt-4 space-y-2.5">
        {services.slice(0, 3).map((svc: string, i: number) => {
          const latestVal = chartData.length > 0 ? (chartData[chartData.length - 1][svc] || 0) : 0;
          const stripeClass = i === 0 ? "progress-stripe-red" : i === 1 ? "progress-stripe-green" : "progress-stripe-blue";
          return (
            <div key={svc} className="flex items-center gap-3">
              <span className="text-[12px] text-gray-500 w-[140px] truncate">{svc}</span>
              <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stripeClass}`}
                  style={{ width: `${Math.min(Math.max(latestVal * 5, 5), 100)}%` }}
                />
              </div>
              <span className="text-[12px] font-semibold text-gray-700 w-12 text-right">
                {latestVal.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
