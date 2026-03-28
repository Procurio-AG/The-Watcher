"use client";

import { useState } from "react";
import { useTraceServices, useTraces, type TraceLookback } from "@/hooks/useTraces";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/cards/StatusBadge";

export default function TracesPage() {
  const { data: traceServices } = useTraceServices();
  const defaultService = traceServices?.[0] || "gateway-service";
  const [service, setService] = useState("gateway-service");
  const [lookback, setLookback] = useState<TraceLookback>("1h");
  const selectedService = traceServices?.includes(service) ? service : defaultService;
  const { data: traces } = useTraces(selectedService, 20, lookback);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Traces" showControls={false} />

      <div className="mb-4 flex gap-3">
        <select
          value={selectedService}
          onChange={(e) => setService(e.target.value)}
          className="mock-pill px-4 py-2.5 text-[13px] focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {(traceServices || [defaultService]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={lookback}
          onChange={(e) => setLookback(e.target.value as TraceLookback)}
          className="mock-pill px-4 py-2.5 text-[13px] focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="1h">Last 1 hour</option>
          <option value="6h">Last 6 hours</option>
          <option value="24h">Last 24 hours</option>
        </select>
      </div>

      <div className="mock-panel flex-1 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-[#faf9f6]">
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Trace ID
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Operation
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Duration
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Spans
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Services
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {(traces || []).slice(0, 10).map((trace: any) => (
              <tr
                key={trace.traceID}
                className="border-b border-surface-200 last:border-0 hover:bg-surface-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 text-[13px] font-mono text-blue-600 truncate max-w-[180px]">
                  {trace.traceID}
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-gray-900">{trace.operation}</td>
                <td className="px-6 py-4 text-[13px] text-right font-medium text-gray-700">
                  {trace.duration_ms}ms
                </td>
                <td className="px-6 py-4 text-[13px] text-right text-gray-700">
                  {trace.spans_count}
                </td>
                <td className="px-6 py-4 text-[11px] text-gray-500">
                  {(trace.services || []).join(", ")}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={trace.has_error ? "critical" : "healthy"} size="md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!traces || traces.length === 0) && (
          <div className="py-16 text-center text-[13px] text-gray-400">No traces available</div>
        )}
      </div>
    </div>
  );
}
