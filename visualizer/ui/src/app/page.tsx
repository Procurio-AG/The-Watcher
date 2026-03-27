"use client";
import { useOverview } from "@/hooks/useMetrics";
import PageHeader from "@/components/layout/PageHeader";
import LatencyChart from "@/components/charts/LatencyChart";
import ErrorChart from "@/components/charts/ErrorChart";
import RequestVolume from "@/components/charts/RequestVolume";
import AIIncidentPanel from "@/components/panels/AIIncidentPanel";
import ServiceErrors from "@/components/panels/ServiceErrors";
import TopErrors from "@/components/panels/TopErrors";
import SearchBar from "@/components/shared/SearchBar";
import { formatDuration, formatPercent, formatNumber } from "@/lib/utils";

export default function SystemOverview() {
  const { data: overview } = useOverview();

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Overview"
        systemState={overview?.system_state || "healthy"}
      />

      {/* Viewport-filling dashboard grid */}
      <div
        className="flex-1 grid gap-4 min-h-0"
        style={{
          gridTemplateColumns: "5fr 3fr 4fr",
          gridTemplateRows: "1fr auto 0.7fr",
        }}
      >
        {/* [A] Hero Latency Chart — col 1-2, row 1 */}
        <div className="col-span-2 min-h-0">
          <LatencyChart />
        </div>

        {/* [B] Stats + Error Chart — col 3, row 1-2 */}
        <div className="row-span-2 min-h-0 flex flex-col gap-4">
          {/* Stat cards */}
          <div className="bg-white rounded-3xl p-5 border border-surface-200 shadow-card">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[12px] text-gray-500 font-medium mb-1">Error Rate</p>
                <div className="flex items-end gap-2">
                  <span className="text-stat-sm text-gray-900">
                    {overview ? formatPercent(overview.error_rate) : "—"}
                  </span>
                  {overview?.error_rate_delta !== undefined &&
                    Math.abs(overview.error_rate_delta) > 0.001 && (
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                          overview.error_rate_delta > 0
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {overview.error_rate_delta > 0 ? "\u25b2" : "\u25bc"}{" "}
                        {Math.abs(overview.error_rate_delta).toFixed(1)}%
                      </span>
                    )}
                </div>
              </div>
              <div>
                <p className="text-[12px] text-gray-500 font-medium mb-1">Avg. Latency</p>
                <div className="flex items-end gap-2">
                  <span className="text-stat-sm text-gray-900">
                    {overview ? formatDuration(overview.latency_p95) : "—"}
                  </span>
                  {overview?.latency_p95_delta !== undefined &&
                    Math.abs(overview.latency_p95_delta) > 0.001 && (
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                        {"\u25cf"} {formatDuration(Math.abs(overview.latency_p95_delta))}
                      </span>
                    )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] text-gray-500 font-medium mb-1">Requests/sec</p>
                <span className="text-stat-sm text-gray-900">
                  {overview ? formatNumber(overview.rps) : "—"}
                </span>
              </div>
              <div>
                <p className="text-[12px] text-gray-500 font-medium mb-1">Active Services</p>
                <span className="text-stat-sm text-gray-900">
                  {overview ? `${overview.active_services}` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Error Chart fills remaining */}
          <div className="flex-1 min-h-0">
            <ErrorChart />
          </div>
        </div>

        {/* [C] Search Bar — col 1-2, row 2 */}
        <div className="col-span-2">
          <SearchBar />
        </div>

        {/* [D] Service Errors — col 1, row 3 */}
        <div className="min-h-0">
          <ServiceErrors />
        </div>

        {/* [E] Top Errors + Request Volume stacked — col 2, row 3 */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0">
            <TopErrors />
          </div>
          <div className="flex-1 min-h-0">
            <RequestVolume />
          </div>
        </div>

        {/* [F] AI Insights — col 3, row 3 */}
        <div className="min-h-0">
          <AIIncidentPanel />
        </div>
      </div>
    </div>
  );
}
