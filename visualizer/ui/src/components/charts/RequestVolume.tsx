"use client";

import { useRequestSeries, type MetricsRange } from "@/hooks/useMetrics";

export default function RequestVolume({ range }: { range: MetricsRange }) {
  const { data } = useRequestSeries(range);

  const timeMap = new Map<number, number>();
  (data || []).forEach((series: any) => {
    (series.values || []).forEach((point: any) => {
      const ts = point.timestamp * 1000;
      timeMap.set(ts, (timeMap.get(ts) || 0) + point.value);
    });
  });

  const chartData = Array.from(timeMap.entries())
    .map(([time, value]) => ({ time, value: Math.round(value) }))
    .sort((a, b) => a.time - b.time);

  const latest = chartData[chartData.length - 1]?.value || 0;
  const previous = chartData[Math.max(chartData.length - 4, 0)]?.value || 0;
  const delta = latest - previous;
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <div className="mock-panel card-hover flex h-full flex-col p-4">
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">
          Request Volume
        </h3>
      </div>

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[34px] font-semibold leading-none tracking-[-0.05em] text-[#202022]">
            {latest}
          </p>
          <p className="mt-1 text-[12px] text-[#9a948d]">requests/sec</p>
        </div>
        <div className="text-right">
          <p className={`text-[24px] font-semibold tracking-[-0.05em] ${delta >= 0 ? "text-[#4f9f64]" : "text-[#d66f76]"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </p>
          <p className="text-[11px] text-[#a39d96]">vs prior sample</p>
        </div>
      </div>

      <div className="mt-auto flex h-[96px] items-end gap-2 rounded-[18px] bg-[#f9fbff] px-2.5 pb-2.5 pt-4">
        {chartData.slice(-12).map((item, index) => (
          <div key={`${item.time}-${index}`} className="flex flex-1 items-end">
            <div
              className="w-full rounded-full bg-gradient-to-t from-[#6a9ff7] to-[#bed0ff]"
              style={{ height: `${Math.max((item.value / maxValue) * 72, 10)}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
