"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/cards/StatusBadge";

export default function ServicesPage() {
  const { data: services } = useSWR("/api/services", (p: string) => apiFetch<any[]>(p), {
    refreshInterval: 10000,
  });

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Services" showControls={false} />
      <div className="mock-panel flex-1 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-[#faf9f6]">
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Service
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                P95 Latency
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Error Rate
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Requests/s
              </th>
            </tr>
          </thead>
          <tbody>
            {(services || []).slice(0, 9).map((svc: any) => (
              <tr
                key={svc.name}
                className="cursor-pointer border-b border-surface-200 last:border-0 hover:bg-surface-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-[13px] font-semibold text-gray-900">{svc.name}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={svc.status} size="md" />
                </td>
                <td className="px-6 py-4 text-[13px] text-right font-medium text-gray-700">
                  {svc.latency_p95.toFixed(1)}ms
                </td>
                <td className="px-6 py-4 text-[13px] text-right">
                  <span
                    className={`font-semibold ${
                      svc.error_rate > 5 ? "text-red-500" : "text-gray-700"
                    }`}
                  >
                    {svc.error_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-[13px] text-right font-medium text-gray-700">
                  {svc.rps.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!services || services.length === 0) && (
          <div className="py-16 text-center text-[13px] text-gray-400">Loading services...</div>
        )}
      </div>
    </div>
  );
}
