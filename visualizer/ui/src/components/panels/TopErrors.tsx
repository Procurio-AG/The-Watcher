"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";

interface ServiceData {
  name: string;
  status: string;
  error_rate: number;
  latency_p95: number;
}

export default function TopErrors() {
  const { data: services } = useSWR("/api/services", (path: string) => apiFetch<ServiceData[]>(path), {
    refreshInterval: 10000,
  });

  const sorted = [...(services || [])].sort((a, b) => b.error_rate - a.error_rate);
  const top = sorted.slice(0, 5);
  const maxRate = Math.max(...top.map((s) => s.error_rate), 0.0001);

  return (
    <div className="glass-card flex min-h-[240px] flex-col p-5">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-[15px] font-semibold text-[#2c2c2c]">Top Errors</h3>
        {top.length > 0 && (
          <span className="rounded-full bg-[#fff0f1] px-3 py-1 text-[12px] font-semibold text-[#c86d73]">
            {top.length} services
          </span>
        )}
      </div>

      {top.length > 0 ? (
        <>
          <div className="mb-3 flex h-[56px] items-end gap-1.5">
            {top.map((svc) => (
              <div
                key={svc.name}
                className="flex-1 rounded-t-[8px] bg-gradient-to-t from-[#de6f72] to-[#f5b8ba]"
                style={{ height: `${Math.max((svc.error_rate / maxRate) * 100, 12)}%` }}
              />
            ))}
          </div>

          <div className="space-y-2 text-[12px]">
            {top.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between text-[#6b6b6b]">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full bg-[#de6f72]" />
                  <span className="truncate">{svc.name}</span>
                </div>
                <span className="font-semibold text-[#4e4e4e]">{(svc.error_rate * 100).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-[13px] text-[#9a9a9a]">No service data available</div>
      )}
    </div>
  );
}
