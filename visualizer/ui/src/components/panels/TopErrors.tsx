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
  const { data: services, isLoading } = useSWR("/api/services", (path: string) => apiFetch<ServiceData[]>(path), {
    refreshInterval: 10000,
  });

  const sorted = [...(services || [])].sort((a, b) => b.error_rate - a.error_rate);
  const top = sorted.slice(0, 5);
  const maxRate = Math.max(...top.map((s) => s.error_rate), 0.0001);

  return (
    <div className="glass-card flex min-h-[240px] flex-col p-5">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-[16px] font-semibold text-[color:var(--text-primary)]">Top Errors</h3>
        {top.length > 0 && (
          <span className="status-chip-danger rounded-full px-3 py-1 text-[12px] font-semibold">
            {top.length} services
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={`top-errors-skeleton-${idx}`} className="skeleton-line" />
          ))}
        </div>
      ) : top.length > 0 ? (
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
              <div key={svc.name} className="flex items-center justify-between text-[color:var(--text-secondary)]">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full bg-[#de6f72]" />
                  <span className="truncate">{svc.name}</span>
                </div>
                <span className="font-semibold text-[color:var(--text-secondary)]">{(svc.error_rate * 100).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="dashboard-empty-state flex-1 rounded-[18px] border border-dashed border-[color:var(--card-border)]">
          No service error data is available yet.
        </div>
      )}
    </div>
  );
}
