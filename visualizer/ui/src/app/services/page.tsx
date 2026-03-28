"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/cards/StatusBadge";
import RequestVolume from "@/components/charts/RequestVolume";
import TopErrors from "@/components/panels/TopErrors";
import DiagnosticsPanel from "@/components/panels/DiagnosticsPanel";
import SimulationControl from "@/components/panels/SimulationControl";
import type { MetricsRange } from "@/hooks/useMetrics";
import { formatDuration } from "@/lib/utils";

export default function ServicesPage() {
  const { data: services, isLoading } = useSWR("/api/services", (path: string) => apiFetch<any[]>(path), {
    refreshInterval: 10000,
  });
  const [range, setRange] = useState<MetricsRange>("15m");

  const sortedServices = [...(services || [])].sort((a, b) => b.rps - a.rps);

  return (
    <div className="flex h-full flex-col overflow-hidden pt-1 section-fade">
      <PageHeader
        title="Services"
        subtitle="Operational health, traffic, and support tooling for the active microservices"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="dashboard-table-shell min-h-0 p-2">
          <div className="table-toolbar">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">Service Inventory</h2>
              <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">Status and live performance from the backend service summary endpoint</p>
            </div>
            <span className="rounded-full bg-[color:var(--control-bg)] px-3 py-1 text-[12px] font-semibold text-[color:var(--text-secondary)]">{sortedServices.length} tracked</span>
          </div>

          <div className="min-h-0 overflow-auto hide-scrollbar">
            <table className="w-full table-fixed">
            <thead>
              <tr className="table-head-row sticky top-0 z-10">
                <th className="table-head-cell">Service</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell text-right">P95 Latency</th>
                <th className="table-head-cell text-right">Error Rate</th>
                <th className="table-head-cell text-right">Requests/s</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={`service-skeleton-${idx}`} className="border-b border-[color:var(--card-border)]">
                      <td className="px-4 py-4"><div className="skeleton-line" /></td>
                      <td className="px-4 py-4"><div className="skeleton-line" /></td>
                      <td className="px-4 py-4"><div className="skeleton-line" /></td>
                      <td className="px-4 py-4"><div className="skeleton-line" /></td>
                      <td className="px-4 py-4"><div className="skeleton-line" /></td>
                    </tr>
                  ))
                : null}
              {sortedServices.slice(0, 10).map((service) => (
                <tr key={service.name} className="table-row-hover border-b border-[color:var(--card-border)] text-[14px] last:border-b-0">
                  <td className="px-4 py-4 font-semibold text-[color:var(--text-primary)]">{service.name}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={service.status} size="md" />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-[color:var(--text-secondary)]">{formatDuration(service.latency_p95)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-[color:var(--text-secondary)]">{service.error_rate.toFixed(2)}%</td>
                  <td className="px-4 py-4 text-right font-semibold text-[color:var(--text-secondary)]">{service.rps.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            </table>

            {!isLoading && sortedServices.length === 0 && (
              <div className="dashboard-empty-state h-[320px]">
                No services are reporting yet. Start the stack and observability backends to populate this table.
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-5">
          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">Operational Actions</h3>
                <p className="mt-1 text-[12px] leading-5 text-[color:var(--text-muted)]">
                  Trigger the attack-and-resolve simulation here so the overview remains focused on core signals.
                </p>
              </div>
              <SimulationControl />
            </div>
          </div>
          <RequestVolume range={range} />
          <TopErrors />
          <DiagnosticsPanel />
        </div>
      </div>
    </div>
  );
}
