"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";

export default function TopErrors() {
  const { data: services } = useSWR("/api/services", (path: string) => apiFetch<any[]>(path), {
    refreshInterval: 10000,
  });

  const worstService = (services || []).sort((a: any, b: any) => b.error_rate - a.error_rate)[0];
  const { data: breakdown } = useSWR(
    worstService ? `/api/services/${worstService.name}/errors` : null,
    (path: string) => apiFetch<any[]>(path),
    { refreshInterval: 10000 }
  );

  const topBreakdown = (breakdown || []).sort((a: any, b: any) => b.rate - a.rate).slice(0, 3);
  const maxRate = Math.max(...topBreakdown.map((item: any) => item.rate), 0.0001);

  return (
    <div className="mock-panel card-hover flex h-full flex-col p-4">
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">
          Top Errors
        </h3>
      </div>

      {worstService ? (
        <>
          <div className="mb-3 flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d66f76]" />
            <span className="font-medium text-[#474540]">{worstService.name}</span>
          </div>

          <div className="mb-4 flex items-center gap-4 text-[12px] text-[#8b8780]">
            <span>Latency {worstService.latency_p95.toFixed(0)}ms</span>
            <span>Status {worstService.status}</span>
          </div>

          <div className="mt-auto space-y-2.5">
            {topBreakdown.length === 0 ? (
              <p className="py-4 text-[12px] text-[#8b8780]">No handler breakdown available.</p>
            ) : (
              topBreakdown.map((item: any) => (
                <div key={`${item.handler}-${item.status}`}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="truncate text-[#5c5954]">
                      {item.handler} ({item.status})
                    </span>
                    <span className="font-semibold text-[#3f3e39]">
                      {(item.rate * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#edf6ee]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#4db072] to-[#bdeac8]"
                      style={{ width: `${Math.max((item.rate / maxRate) * 100, 12)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-[13px] text-gray-400">No service data available</p>
      )}
    </div>
  );
}
