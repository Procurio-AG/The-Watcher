"use client";

import { useState } from "react";
import { Loader2, Search, Zap, Plus } from "lucide-react";
import LatencyChart from "@/components/charts/LatencyChart";
import ServiceErrors from "@/components/panels/ServiceErrors";
import TopErrors from "@/components/panels/TopErrors";
import RecentLogs from "@/components/panels/RecentLogs";
import AIIncidentPanel from "@/components/panels/AIIncidentPanel";
import ExplorePanel from "@/components/panels/ExplorePanel";
import ScenarioModal from "@/components/panels/ScenarioModal";
import { useOverview, type MetricsRange } from "@/hooks/useMetrics";
import { askAI } from "@/hooks/useIncidents";
import { formatDuration } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

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
      ? "status-chip-danger"
      : deltaTone === "warning"
        ? "status-chip-warning"
        : "status-chip-success";

  return (
    <div className="p-5 lg:p-6">
      <div className="text-[13px] font-medium text-[color:var(--text-secondary)]">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-[38px] font-semibold tracking-[-0.06em] text-[color:var(--text-primary)] lg:text-[52px]">{value}</span>
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
  const [scenarioOpen, setScenarioOpen] = useState(false);

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
    <div className="flex flex-col pt-1 section-fade">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Overview"
          subtitle="Live service health, latency, error rates, and AI-assisted incident context"
          range={range}
          onRangeChange={setRange}
          systemState={overview?.system_state}
        />
        <button
          onClick={() => setScenarioOpen(true)}
          className="inline-flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-[13px] font-semibold shadow-md transition-all hover:shadow-lg"
          style={{ background: "var(--accent)", color: "var(--shell-bg)" }}
        >
          <Plus className="h-4 w-4" />
          Create a New Scenario
        </button>
      </div>

      <ScenarioModal open={scenarioOpen} onClose={() => setScenarioOpen(false)} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-h-0 flex-col gap-5">
          <section className="glass-card overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              <div className="metric-divider border-b border-[color:var(--card-border)] lg:border-b-0">
                <MetricCard
                  label="Error Rate"
                  value={`${overview?.error_rate?.toFixed(1) || "0.0"}%`}
                  delta={overview?.error_rate_delta ? `${overview.error_rate_delta > 0 ? "+" : ""}${overview.error_rate_delta.toFixed(1)}%` : undefined}
                  deltaTone="danger"
                />
              </div>
              <div className="metric-divider border-b border-[color:var(--card-border)] lg:border-b-0">
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

          <section className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[34px] font-medium tracking-[-0.05em] text-[color:var(--text-primary)]">Payments</h3>
            </div>
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
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--text-secondary)] transition hover:bg-[color:var(--control-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {answer ? (
              <div className="dashboard-card-subtle mt-4 px-4 py-3 text-[13px] leading-6 text-[color:var(--text-secondary)]">{answer}</div>
            ) : null}
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
            <ServiceErrors range={range} />
            <div className="grid grid-cols-1 gap-5">
              <TopErrors />
              <RecentLogs />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <AIIncidentPanel />
          <ExplorePanel />
        </div>
      </div>
    </div>
  );
}
