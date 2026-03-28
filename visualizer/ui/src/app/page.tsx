"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, ChevronDown, Loader2, Search } from "lucide-react";
import LatencyChart from "@/components/charts/LatencyChart";
import ServiceErrors from "@/components/panels/ServiceErrors";
import TopErrors from "@/components/panels/TopErrors";
import RecentLogs from "@/components/panels/RecentLogs";
import AIIncidentPanel from "@/components/panels/AIIncidentPanel";
import ExplorePanel from "@/components/panels/ExplorePanel";
import DiagnosticsPanel from "@/components/panels/DiagnosticsPanel";
import SimulationControl from "@/components/panels/SimulationControl";
import { useOverview, type MetricsRange } from "@/hooks/useMetrics";
import { askAI } from "@/hooks/useIncidents";
import { formatDuration } from "@/lib/utils";

function MetricCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "danger" | "warning" | "neutral";
}) {
  const tone =
    deltaTone === "danger"
      ? "bg-[#fff0f1] text-[#c86d73]"
      : deltaTone === "warning"
        ? "bg-[#f7f3d8] text-[#9a8c34]"
        : "bg-[#eef8ef] text-[#4aa067]";

  return (
    <div className="p-5 lg:p-6">
      <div className="text-[13px] font-medium text-[#686868]">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-[36px] font-semibold tracking-[-0.06em] text-[#1d1d1d] lg:text-[48px]">{value}</span>
        {delta ? <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${tone}`}>{delta}</span> : null}
      </div>
    </div>
  );
}

export default function SystemOverviewPage() {
  const { data: overview } = useOverview();
  const [range, setRange] = useState<MetricsRange>("15m");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const response = await askAI(query);
      setAnswer(response.answer);
    } catch {
      setAnswer("Unable to analyze the system right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden hide-scrollbar">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 py-1">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-[#de746d]" strokeWidth={2} />
          <h1 className="text-[28px] font-semibold tracking-[-0.06em] text-[#1d1d1d] lg:text-[34px]">System Overview</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="glass-pill">
            <CalendarDays className="h-4 w-4 text-[#8f8f8f]" />
            <select value={range} onChange={(event) => setRange(event.target.value as MetricsRange)} className="bg-transparent outline-none">
              <option value="15m">Last 15 min</option>
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
            </select>
            <ChevronDown className="h-4 w-4 text-[#9b9b9b]" />
          </div>
          <SimulationControl />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-5 grid grid-cols-1 gap-5 pb-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Stat cards */}
          <section className="glass-card overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              <div className="metric-divider border-b border-[#efebe5] lg:border-b-0">
                <MetricCard
                  label="Error Rate"
                  value={`${overview?.error_rate?.toFixed(1) || "0.0"}%`}
                  delta={overview?.error_rate_delta ? `${overview.error_rate_delta > 0 ? "+" : ""}${overview.error_rate_delta.toFixed(1)}%` : undefined}
                  deltaTone="danger"
                />
              </div>
              <div className="metric-divider border-b border-[#efebe5] lg:border-b-0">
                <MetricCard
                  label="Avg. Latency"
                  value={formatDuration(overview?.latency_p95 || 0)}
                  delta={overview?.latency_p95_delta ? `${overview.latency_p95_delta > 0 ? "+" : ""}${formatDuration(Math.abs(overview.latency_p95_delta))}` : undefined}
                  deltaTone="warning"
                />
              </div>
              <div className="metric-divider">
                <MetricCard label="Requests/sec" value={`${overview?.rps?.toFixed(0) || "0"}`} />
              </div>
              <MetricCard label="Active Services" value={`${overview?.active_services || 0}`} />
            </div>
          </section>

          {/* Latency chart */}
          <section className="glass-card p-5">
            <div style={{ height: 280 }}>
              <LatencyChart range={range} />
            </div>

            <div className="mt-4">
              <div className="dashboard-input flex items-center gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAsk();
                  }}
                  placeholder="What do you want to know?"
                  className="flex-1 bg-transparent outline-none"
                />
                <button
                  onClick={handleAsk}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#7b7b7b] transition hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {answer ? (
              <div className="dashboard-card-subtle mt-4 px-4 py-3 text-[13px] leading-6 text-[#5a5a5a]">{answer}</div>
            ) : null}
          </section>

          {/* Bottom panels */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
            <ServiceErrors range={range} />
            <div className="grid grid-cols-1 gap-5">
              <TopErrors />
              <RecentLogs />
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <AIIncidentPanel />
          <ExplorePanel />
          <DiagnosticsPanel />
        </div>
      </div>
    </div>
  );
}
