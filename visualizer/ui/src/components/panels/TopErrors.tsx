"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";

export default function TopErrors() {
  const { data: services } = useSWR("/api/services", (path: string) => apiFetch<any[]>(path), {
    refreshInterval: 10000,
  });

  const worstService = [...(services || [])].sort((a, b) => b.error_rate - a.error_rate)[0];
  const { data: breakdown } = useSWR(
    worstService ? `/api/services/${worstService.name}/errors` : null,
    (path: string) => apiFetch<any[]>(path),
    { refreshInterval: 10000 }
  );

  const topBreakdown = [...(breakdown || [])].sort((a, b) => b.rate - a.rate).slice(0, 4);
  const maxRate = Math.max(...topBreakdown.map((item) => item.rate), 0.0001);
  const bars = Array.from({ length: 12 }, (_, index) => (topBreakdown.length ? topBreakdown[index % topBreakdown.length].rate : 0));

  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-[15px] font-semibold text-[#2c2c2c]">Top Errors</h3>
        {worstService ? (
          <span className="rounded-full bg-[#edf7ef] px-3 py-1 text-[12px] font-semibold text-[#4aa068]">
            +{Math.round(worstService.error_rate * 10)}%
          </span>
        ) : null}
      </div>

      {worstService ? (
        <>
          <div className="flex items-center gap-2 text-[16px] font-semibold text-[#2b2b2b]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#de6f72]" />
            {worstService.name}
          </div>
          <div className="mt-2 text-[12px] text-[#868686]">
            Duration {worstService.latency_p95.toFixed(0)}ms · Status {worstService.status}
          </div>

          <div className="mt-auto">
            <div className="mb-3 flex h-[56px] items-end gap-1.5">
              {bars.map((bar, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-[8px] bg-gradient-to-t from-[#46c56f] to-[#bfe9c8]"
                  style={{ height: `${Math.max((bar / maxRate) * 100, 12)}%` }}
                />
              ))}
            </div>

            <div className="space-y-1.5 text-[12px]">
              {topBreakdown.map((item) => (
                <div key={`${item.handler}-${item.status}`} className="flex items-center justify-between text-[#6b6b6b]">
                  <span className="truncate">
                    {item.handler} · {item.status}
                  </span>
                  <span className="font-semibold text-[#4e4e4e]">{(item.rate * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-[13px] text-[#9a9a9a]">No service data available</div>
      )}
    </div>
  );
}
