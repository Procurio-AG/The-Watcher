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
  const sparkBars = Array.from({ length: 12 }, (_, index) => {
    if (!topBreakdown.length) return 0;
    return topBreakdown[index % topBreakdown.length].rate;
  });

  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">Top Errors</h3>
          <p className="mt-1 text-[12px] text-[#999]">Service with the strongest error signal</p>
        </div>
        {worstService ? (
          <span className="rounded-full bg-[rgba(143,254,1,0.15)] px-3 py-1 text-[12px] font-bold text-[#3a7a00]">
            {worstService.error_rate.toFixed(1)}%
          </span>
        ) : null}
      </div>

      {worstService ? (
        <>
          <div className="mt-5 flex items-center gap-2 text-[17px] font-bold tracking-[-0.03em] text-[#1a1a1a]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7201FF]" />
            {worstService.name}
          </div>

          <div className="mt-2 flex items-center gap-4 text-[12px] text-[#999]">
            <span>Latency {worstService.latency_p95.toFixed(0)}ms</span>
            <span className="capitalize">Status {worstService.status}</span>
          </div>

          <div className="mt-auto">
            <div className="mb-3 flex h-[54px] items-end gap-1.5">
              {sparkBars.map((bar, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-[6px]"
                  style={{
                    height: `${Math.max((bar / maxRate) * 100, 14)}%`,
                    background: "linear-gradient(to top, #7201FF, #c9a0ff)",
                    opacity: 0.65,
                  }}
                />
              ))}
            </div>

            <div className="space-y-2">
              {topBreakdown.length === 0 ? (
                <p className="text-[12px] text-[#999]">No endpoint breakdown available.</p>
              ) : (
                topBreakdown.map((item) => (
                  <div key={`${item.handler}-${item.status}`} className="flex items-center justify-between text-[12px]">
                    <span className="truncate text-[#666]">
                      {item.handler} · {item.status}
                    </span>
                    <span className="font-bold text-[#7201FF]">{(item.rate * 100).toFixed(2)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-[13px] text-[#999]">No service data available</div>
      )}
    </div>
  );
}
