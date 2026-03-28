"use client";

import PageHeader from "@/components/layout/PageHeader";
import AIIncidentPanel from "@/components/panels/AIIncidentPanel";
import ExplorePanel from "@/components/panels/ExplorePanel";
import { useCurrentIncident } from "@/hooks/useIncidents";
import StatusBadge from "@/components/cards/StatusBadge";

export default function IncidentsPage() {
  const { data } = useCurrentIncident();
  const serviceHealth = data?.service_health || [];

  return (
    <div className="flex h-full flex-col overflow-hidden pt-1">
      <PageHeader
        title="Incidents"
        subtitle="Current AI-derived root cause analysis and per-service health signals"
        showControls={false}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.25fr)_390px] gap-5">
        <div className="dashboard-card min-h-0 overflow-hidden p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[20px] font-semibold tracking-[-0.04em] text-[#1f1f1f]">Service Health Snapshot</h3>
              <p className="mt-1 text-[13px] text-[#959595]">Live metrics used by the backend incident analyzer</p>
            </div>
            <StatusBadge status={data?.severity || "healthy"} size="md" />
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[#efede8] bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_140px_140px] border-b border-[#efede8] px-5 py-4 text-[11px] uppercase tracking-[0.12em] text-[#9b9b9b]">
              <span>Service</span>
              <span className="text-right">Error Rate</span>
              <span className="text-right">P95 Latency</span>
            </div>

            {serviceHealth.slice(0, 10).map((service: any) => (
              <div
                key={service.service}
                className="grid grid-cols-[minmax(0,1fr)_140px_140px] items-center border-b border-[#f2efea] px-5 py-4 text-[14px] last:border-b-0"
              >
                <span className="truncate font-semibold text-[#313131]">{service.service}</span>
                <span className="text-right font-semibold text-[#4d4d4d]">{service.error_rate.toFixed(2)}%</span>
                <span className="text-right font-semibold text-[#4d4d4d]">{(service.latency_p95 * 1000).toFixed(0)}ms</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_250px] gap-5">
          <AIIncidentPanel />
          <ExplorePanel />
        </div>
      </div>
    </div>
  );
}
