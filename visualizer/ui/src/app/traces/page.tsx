"use client";

import { useMemo, useState } from "react";
import { useTraceServices, useTraces, type TraceLookback } from "@/hooks/useTraces";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/cards/StatusBadge";

export default function TracesPage() {
  const { data: traceServices, isLoading: traceServicesLoading } = useTraceServices();
  const serviceOptions = traceServices || [];
  const initialService = serviceOptions[0] || "gateway-service";
  const [service, setService] = useState("gateway-service");
  const [lookback, setLookback] = useState<TraceLookback>("1h");

  const selectedService = useMemo(() => {
    return serviceOptions.includes(service) ? service : initialService;
  }, [initialService, service, serviceOptions]);

  const { data: traces, isLoading: tracesLoading } = useTraces(selectedService, 20, lookback);

  return (
    <div className="flex h-full flex-col overflow-hidden pt-1 section-fade">
      <PageHeader
        title="Traces"
        subtitle="Jaeger trace summaries with backend-driven service discovery and lookback controls"
        showControls
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="dashboard-table-shell min-h-0 p-2">
          <div className="table-toolbar">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">Trace Explorer</h2>
              <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">Select a traced service and a real Jaeger lookback window.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
          </div>

          <div className="min-h-0 overflow-auto hide-scrollbar">
            <table className="w-full table-fixed">
          <thead>
            <tr className="table-head-row sticky top-0 z-10">
              <th className="table-head-cell">Trace ID</th>
              <th className="table-head-cell">Operation</th>
              <th className="table-head-cell text-right">Duration</th>
              <th className="table-head-cell text-right">Spans</th>
              <th className="table-head-cell">Services</th>
              <th className="table-head-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {tracesLoading
              ? Array.from({ length: 7 }).map((_, idx) => (
                  <tr key={`trace-skeleton-${idx}`} className="border-b border-[color:var(--card-border)]">
                    <td className="px-4 py-4"><div className="skeleton-line" /></td>
                    <td className="px-4 py-4"><div className="skeleton-line" /></td>
                    <td className="px-4 py-4"><div className="skeleton-line" /></td>
                    <td className="px-4 py-4"><div className="skeleton-line" /></td>
                    <td className="px-4 py-4"><div className="skeleton-line" /></td>
                    <td className="px-4 py-4"><div className="skeleton-line" /></td>
                  </tr>
                ))
              : null}
            {(traces || []).slice(0, 10).map((trace: any) => (
              <tr key={trace.traceID} className="table-row-hover border-b border-[color:var(--card-border)] text-[13px] last:border-b-0">
                <td className="truncate px-4 py-4 font-mono font-semibold text-[color:var(--status-info-text)]">{trace.traceID}</td>
                <td className="px-4 py-4 font-semibold text-[color:var(--text-primary)]">{trace.operation}</td>
                <td className="px-4 py-4 text-right font-semibold text-[color:var(--text-secondary)]">{trace.duration_ms}ms</td>
                <td className="px-4 py-4 text-right font-semibold text-[color:var(--text-secondary)]">{trace.spans_count}</td>
                <td className="truncate px-4 py-4 text-[color:var(--text-secondary)]">{(trace.services || []).join(", ")}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={trace.has_error ? "critical" : "healthy"} size="md" />
                </td>
              </tr>
            ))}
          </tbody>
            </table>

            {!tracesLoading && (!traces || traces.length === 0) && (
              <div className="dashboard-empty-state h-[420px]">
                No traces are available for this service and lookback window. If the system is active, verify that Jaeger is reachable.
              </div>
            )}
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5">
          <div className="glass-card p-5">
            <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)]">Trace Scope</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
              <div className="dashboard-card-subtle p-4">
                <div className="text-[color:var(--text-muted)]">Service</div>
                <div className="mt-1 truncate font-semibold text-[color:var(--text-primary)]">
                  {traceServicesLoading ? "Loading..." : selectedService}
                </div>
              </div>
              <div className="dashboard-card-subtle p-4">
                <div className="text-[color:var(--text-muted)]">Lookback</div>
                <div className="mt-1 font-semibold text-[color:var(--text-primary)]">{lookback}</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)]">How To Read This</h3>
            <div className="mt-4 space-y-3 text-[13px] leading-6 text-[color:var(--text-secondary)]">
              <p>Each row shows a root trace summary from the backend trace endpoint.</p>
              <p>Use the service selector to switch discovery scope and the lookback selector to control Jaeger query range.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
