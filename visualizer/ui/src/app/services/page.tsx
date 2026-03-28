"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/cards/StatusBadge";
import RequestVolume from "@/components/charts/RequestVolume";
import TopErrors from "@/components/panels/TopErrors";

export default function ServicesPage() {
  const { data: services } = useSWR("/api/services", (path: string) => apiFetch<any[]>(path), {
    refreshInterval: 10000,
  });

  const sortedServices = [...(services || [])].sort((a, b) => b.rps - a.rps);

  return (
    <div className="flex h-full flex-col overflow-hidden pt-1">
      <PageHeader
        title="Services"
        subtitle="Service health, latency, request throughput, and backend-derived status"
        showControls={false}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.5fr)_360px] gap-5">
        <div className="dashboard-card min-h-0 overflow-hidden p-2">
          <table className="h-full w-full table-fixed">
            <thead>
              <tr className="border-b border-white/30 text-left text-[11px] uppercase tracking-[0.12em] text-[#999]">
                <th className="px-4 py-4 font-semibold">Service</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 text-right font-semibold">P95 Latency</th>
                <th className="px-4 py-4 text-right font-semibold">Error Rate</th>
                <th className="px-4 py-4 text-right font-semibold">Requests/s</th>
              </tr>
            </thead>
            <tbody>
              {sortedServices.slice(0, 10).map((service) => (
                <tr key={service.name} className="border-b border-white/20 text-[14px] last:border-b-0">
                  <td className="px-4 py-4 font-semibold text-[#1a1a1a]">{service.name}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={service.status} size="md" />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-[#555]">{service.latency_p95.toFixed(1)}ms</td>
                  <td className="px-4 py-4 text-right font-semibold text-[#555]">{service.error_rate.toFixed(2)}%</td>
                  <td className="px-4 py-4 text-right font-semibold text-[#555]">{service.rps.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid min-h-0 grid-rows-2 gap-5">
          <RequestVolume range="15m" />
          <TopErrors />
        </div>
      </div>
    </div>
  );
}
