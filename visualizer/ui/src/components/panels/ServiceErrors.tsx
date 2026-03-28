"use client";

import { useErrorSeries, useRequestSeries, type MetricsRange } from "@/hooks/useMetrics";
import { formatPercent } from "@/lib/utils";

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

  const totalError = topErrors.reduce((sum, item) => sum + item.value, 0);
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
  const firstVolume = volumes[0] || 0;
  const lastVolume = volumes[volumes.length - 1] || 0;
  const volumeDelta = firstVolume > 0 ? ((lastVolume - firstVolume) / firstVolume) * 100 : 0;

  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">Service Errors</h3>
          <p className="mt-1 text-[12px] text-[#999]">Highest live error rates by service</p>
        </div>
        <span className="text-[32px] font-bold tracking-[-0.06em] text-[#1a1a1a]">
          {formatPercent(totalError)}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {topErrors.map((item, index) => {
          const colors = ["#7201FF", "#9945FF", "#8FFE01"];
          return (
            <div key={item.service}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="truncate font-medium text-[#666]">{item.service}</span>
                <span className="font-bold text-[#333]">{formatPercent(item.value)}</span>
              </div>
              <div className="h-3 rounded-full bg-white/40">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((item.value / maxError) * 100, 12)}%`,
                    background: colors[index % colors.length],
                    boxShadow: `0 2px 8px ${colors[index % colors.length]}33`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-white/30 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[13px] font-medium text-[#555]">Request Volume</h4>
          <span className="text-[13px] font-bold text-[#7201FF]">
            {volumeDelta >= 0 ? "+" : ""}
            {volumeDelta.toFixed(0)}%
          </span>
        </div>
        <div className="flex h-[80px] items-end gap-2">
          {volumes.map((value, index) => (
            <div key={index} className="flex min-w-0 flex-1 items-end">
              <div
                className="w-full rounded-t-[8px]"
                style={{
                  height: `${Math.max((value / maxVolume) * 100, 10)}%`,
                  background: "linear-gradient(to top, #7201FF, #c9a0ff)",
                  opacity: 0.7,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
