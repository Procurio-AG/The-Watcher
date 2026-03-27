"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useRequestSeries } from "@/hooks/useMetrics";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

export default function RequestVolume() {
  const { data } = useRequestSeries("15m");

  const timeMap = new Map<number, number>();
  (data || []).forEach((series: any) => {
    (series.values || []).forEach((p: any) => {
      const ts = Math.round(p.timestamp) * 1000;
      timeMap.set(ts, (timeMap.get(ts) || 0) + p.value);
    });
  });

  const chartData = Array.from(timeMap.entries())
    .map(([time, rps]) => ({ time, rps: Math.round(rps) }))
    .sort((a, b) => a.time - b.time);

  const totalRps = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.rps, 0) / chartData.length)
    : 0;

  const maxRps = Math.max(...chartData.map((d) => d.rps), 1);

  return (
    <div className="bg-white rounded-3xl p-4 border border-surface-200 shadow-card card-hover h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold text-gray-900">Request Volume</h3>
        <button className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="flex items-end gap-3 mb-4">
        <span className="text-stat-sm text-gray-900">{totalRps}</span>
        <span className="text-[12px] text-gray-400 font-medium pb-0.5">req/s avg</span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(t) => format(new Date(t), "HH:mm")}
              stroke="#d4d1cc"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#d4d1cc" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(t) => format(new Date(t), "HH:mm:ss")}
              contentStyle={{ borderRadius: "14px", border: "1px solid #ece9e4", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", padding: "10px 14px", fontSize: "12px" }}
            />
            <Bar dataKey="rps" radius={[6, 6, 2, 2]} maxBarSize={16}>
              {chartData.map((entry, idx) => {
                const ratio = entry.rps / maxRps;
                const color = ratio > 0.8 ? "#6366f1" : ratio > 0.5 ? "#818cf8" : "#c7d2fe";
                return <Cell key={idx} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
