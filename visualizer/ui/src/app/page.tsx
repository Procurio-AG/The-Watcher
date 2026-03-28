"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import LatencyChart from "@/components/charts/LatencyChart";
import RequestVolume from "@/components/charts/RequestVolume";
import AIIncidentPanel from "@/components/panels/AIIncidentPanel";
import ServiceErrors from "@/components/panels/ServiceErrors";
import TopErrors from "@/components/panels/TopErrors";
import RecentLogs from "@/components/panels/RecentLogs";
import ExplorePanel from "@/components/panels/ExplorePanel";
import { useOverview, type MetricsRange } from "@/hooks/useMetrics";

export default function SystemOverview() {
  const { data: overview } = useOverview();
  const [range, setRange] = useState<MetricsRange>("15m");

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="System Overview"
        systemState={overview?.system_state}
        range={range}
        onRangeChange={setRange}
      />

      <div
        className="grid min-h-0 flex-1 gap-4"
        style={{
          gridTemplateColumns: "minmax(0,1.72fr) minmax(380px,0.98fr)",
          gridTemplateRows: "108px minmax(0,1fr) minmax(0,0.9fr)",
        }}
      >
        <div className="mock-panel grid grid-cols-4 divide-x divide-surface-200 overflow-hidden">
          {[
            {
              label: "Error Rate",
              value: overview ? `${overview.error_rate.toFixed(1)}%` : "0.0%",
              tone: "text-[#d66f76]",
              delta:
                overview?.error_rate_delta !== undefined
                  ? `${overview.error_rate_delta > 0 ? "▲" : "▼"} ${Math.abs(
                      overview.error_rate_delta
                    ).toFixed(1)}%`
                  : null,
              deltaClass: "bg-[#fff2f4] text-[#d66f76]",
            },
            {
              label: "Avg. Latency",
              value: overview
                ? overview.latency_p95 >= 1
                  ? `${overview.latency_p95.toFixed(1)}s`
                  : `${Math.round(overview.latency_p95 * 1000)}ms`
                : "0ms",
              tone: "text-[#202022]",
              delta:
                overview?.latency_p95_delta !== undefined
                  ? `• ${Math.round(Math.abs(overview.latency_p95_delta) * 1000)}ms`
                  : null,
              deltaClass: "bg-[#f6f1dc] text-[#bca03d]",
            },
            {
              label: "Requests/sec",
              value: overview ? `${Math.round(overview.rps)}` : "0",
              tone: "text-[#4f9f64]",
            },
            {
              label: "Active Services",
              value: overview ? `${overview.active_services}` : "0",
              tone: "text-[#202022]",
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col justify-center px-5">
              <p className="text-[14px] font-medium tracking-[-0.02em] text-[#6d6962]">{item.label}</p>
              <div className="mt-3 flex items-center gap-3">
                <p className={`text-stat-sm ${item.tone}`}>{item.value}</p>
                {item.delta ? (
                  <span className={`rounded-full px-2 py-1 text-[12px] font-semibold ${item.deltaClass}`}>
                    {item.delta}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="row-span-2 min-h-0">
          <AIIncidentPanel />
        </div>

        <div className="min-h-0">
          <LatencyChart range={range} />
        </div>

        <div className="grid min-h-0 grid-cols-2 gap-4">
          <div className="grid min-h-0 grid-rows-2 gap-4">
            <div className="min-h-0">
              <ServiceErrors range={range} />
            </div>
            <div className="min-h-0">
              <RequestVolume range={range} />
            </div>
          </div>
          <div className="grid min-h-0 grid-rows-2 gap-4">
            <div className="min-h-0">
              <TopErrors />
            </div>
            <div className="min-h-0">
              <RecentLogs />
            </div>
          </div>
        </div>

        <div className="min-h-0">
          <ExplorePanel />
        </div>
      </div>
    </div>
  );
}
