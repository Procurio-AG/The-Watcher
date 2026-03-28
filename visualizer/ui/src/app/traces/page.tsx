"use client";

import { useMemo, useState } from "react";
import { useTraceServices, useTraces, type TraceLookback } from "@/hooks/useTraces";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/cards/StatusBadge";

export default function TracesPage() {
  const { data: traceServices } = useTraceServices();
  const serviceOptions = traceServices || [];
  const initialService = serviceOptions[0] || "gateway-service";
  const [service, setService] = useState("gateway-service");
  const [lookback, setLookback] = useState<TraceLookback>("1h");

  const selectedService = useMemo(() => {
    return serviceOptions.includes(service) ? service : initialService;
  }, [initialService, service, serviceOptions]);

  const { data: traces } = useTraces(selectedService, 20, lookback);

  return (
    <div className="flex h-full flex-col overflow-hidden pt-1">
      <PageHeader
        title="Traces"
        subtitle="Jaeger trace summaries with real service discovery and lookback controls"
        showControls={false}
      />

      <div className="mb-5 flex items-center gap-3">
        <select value={selectedService} onChange={(event) => setService(event.target.value)} className="dashboard-select min-w-[230px]">
          {(serviceOptions.length ? serviceOptions : [initialService]).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select value={lookback} onChange={(event) => setLookback(event.target.value as TraceLookback)} className="dashboard-select min-w-[180px]">
          <option value="1h">Last 1 hour</option>
          <option value="6h">Last 6 hours</option>
          <option value="24h">Last 24 hours</option>
        </select>
      </div>

      <div className="dashboard-card min-h-0 flex-1 overflow-hidden p-2">
        <table className="h-full w-full table-fixed">
          <thead>
            <tr className="border-b border-white/30 text-left text-[11px] uppercase tracking-[0.12em] text-[#9a9a9a]">
              <th className="px-4 py-4 font-semibold">Trace ID</th>
              <th className="px-4 py-4 font-semibold">Operation</th>
              <th className="px-4 py-4 text-right font-semibold">Duration</th>
              <th className="px-4 py-4 text-right font-semibold">Spans</th>
              <th className="px-4 py-4 font-semibold">Services</th>
              <th className="px-4 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(traces || []).slice(0, 10).map((trace: any) => (
              <tr key={trace.traceID} className="border-b border-white/20 text-[13px] last:border-b-0">
                <td className="truncate px-4 py-4 font-mono font-semibold text-[#7201FF]">{trace.traceID}</td>
                <td className="px-4 py-4 font-semibold text-[#343434]">{trace.operation}</td>
                <td className="px-4 py-4 text-right font-semibold text-[#4d4d4d]">{trace.duration_ms}ms</td>
                <td className="px-4 py-4 text-right font-semibold text-[#4d4d4d]">{trace.spans_count}</td>
                <td className="truncate px-4 py-4 text-[#717171]">{(trace.services || []).join(", ")}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={trace.has_error ? "critical" : "healthy"} size="md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!traces || traces.length === 0) && (
          <div className="flex h-full items-center justify-center text-[14px] text-[#999]">No traces available</div>
        )}
      </div>
    </div>
  );
}
