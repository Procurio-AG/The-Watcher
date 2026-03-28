"use client";

import { useErrorSeries, useRequestSeries, type MetricsRange } from "@/hooks/useMetrics";

function latestValue(values: Array<{ value: number }>) {
  return values?.[values.length - 1]?.value || 0;
}

export default function ServiceErrors({ range }: { range: MetricsRange }) {
  const { data: errorSeries } = useErrorSeries(range);
  const { data: requestSeries } = useRequestSeries(range);

  const topErrors = (errorSeries || [])
    .map((series) => ({ service: series.service, value: latestValue(series.values || []) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const totalSignal = Math.round(topErrors.reduce((sum, item) => sum + item.value, 0) * 100);
  const maxError = Math.max(...topErrors.map((item) => item.value), 0.0001);

  const volumeMap = new Map<number, number>();
  (requestSeries || []).forEach((series) => {
    (series.values || []).forEach((point) => {
      const key = point.timestamp * 1000;
      volumeMap.set(key, (volumeMap.get(key) || 0) + point.value);
    });
  });

  const volumes = Array.from(volumeMap.values()).slice(-8);
  const maxVolume = Math.max(...volumes, 0.0001);
  const first = volumes[0] || 0;
  const last = volumes[volumes.length - 1] || 0;
  const delta = first > 0 ? ((last - first) / first) * 100 : 0;

  const colors = ["#ec8a89", "#efc667", "#b8e0c0"];

  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[#2c2c2c]">Service Errors</h3>
        </div>
        <span className="text-[18px] font-semibold tracking-[-0.04em] text-[#2b2b2b]">{totalSignal}</span>
      </div>

      <div className="mt-4 space-y-3">
        {topErrors.map((item, index) => (
          <div key={item.service}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="truncate text-[#737373]">{item.service.replace("-service", "")}</span>
              <span className="font-semibold text-[#5d5d5d]">+{Math.round(item.value * 10)}</span>
            </div>
            <div className="h-3 rounded-full bg-[#f4f2ef]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((item.value / maxError) * 100, 14)}%`,
                  background: colors[index % colors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-[#efebe5] pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[14px] text-[#464646]">Request Volume</h4>
          <span className="text-[13px] font-semibold text-[#5f8fe5]">
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(0)}%
          </span>
        </div>
        <div className="flex h-[78px] items-end gap-2">
          {volumes.map((value, index) => (
            <div key={index} className="flex-1">
              <div
                className="w-full rounded-t-[8px] bg-gradient-to-t from-[#75a7ff] to-[#cfe1ff]"
                style={{ height: `${Math.max((value / maxVolume) * 100, 10)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
