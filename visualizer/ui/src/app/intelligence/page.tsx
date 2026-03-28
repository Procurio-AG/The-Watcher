"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCurrentIncident, askAI } from "@/hooks/useIncidents";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/cards/StatusBadge";
import { formatDuration } from "@/lib/utils";

interface ServiceHealth {
  service: string;
  error_rate: number;
  latency_p95: number;
}

interface ConversationEntry {
  question: string;
  answer: string;
}

export default function IntelligencePage() {
  const { data: incident, isLoading: incidentLoading } = useCurrentIncident();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);

  const serviceHealth: ServiceHealth[] = incident?.service_health || [];
  const severity = incident?.severity || "healthy";
  const rootCause = incident?.root_cause_service || "—";
  const confidence = incident?.confidence ?? 0;
  const impacts = incident?.impact || [];
  const remediation = incident?.remediation || "No action needed";
  const fixTime = incident?.fix_time_seconds;

  const healthyCount = serviceHealth.filter((s) => s.error_rate < 5 && s.latency_p95 < 1.0).length;
  const degradedCount = serviceHealth.filter((s) => (s.error_rate >= 5 && s.error_rate < 10) || (s.latency_p95 >= 1.0 && s.latency_p95 < 2.0)).length;
  const criticalCount = serviceHealth.filter((s) => s.error_rate >= 10 || s.latency_p95 >= 2.0).length;

  const sorted = [...serviceHealth].sort((a, b) => (b.error_rate + b.latency_p95 * 10) - (a.error_rate + a.latency_p95 * 10));

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    const q = query;
    setQuery("");
    setLoading(true);
    try {
      const res = await askAI(q);
      setConversation((prev) => [...prev, { question: q, answer: res.answer }]);
    } catch {
      setConversation((prev) => [...prev, { question: q, answer: "Unable to analyze the system right now." }]);
    } finally {
      setLoading(false);
    }
  };

  function getServiceStatus(s: ServiceHealth): string {
    if (s.error_rate >= 10 || s.latency_p95 >= 2.0) return "critical";
    if (s.error_rate >= 5 || s.latency_p95 >= 1.0) return "degraded";
    return "healthy";
  }

  return (
    <div className="flex flex-col pt-1 section-fade">
      <PageHeader
        title="Intelligence"
        subtitle="AI-powered root cause analysis, service health scoring, and interactive diagnostics"
        showControls={false}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Detection summary */}
          <section className="glass-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">Root Cause Detection</h2>
              <StatusBadge status={severity} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="dashboard-card-subtle p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-muted)]">Root Cause</div>
                <div className="mt-2 truncate text-[16px] font-semibold text-[color:var(--text-primary)]">{rootCause}</div>
              </div>
              <div className="dashboard-card-subtle p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-muted)]">Confidence</div>
                <div className="mt-2 text-[16px] font-semibold text-[color:var(--text-primary)]">{confidence}%</div>
              </div>
              <div className="dashboard-card-subtle p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-muted)]">Fix Time</div>
                <div className="mt-2 text-[16px] font-semibold text-[color:var(--text-primary)]">{fixTime ? `${fixTime}s` : "—"}</div>
              </div>
              <div className="dashboard-card-subtle p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-muted)]">Action</div>
                <div className="mt-2 truncate text-[14px] font-medium text-[color:var(--text-primary)]">{remediation}</div>
              </div>
            </div>

            {impacts.length > 0 && (
              <div className="mt-4 rounded-[16px] border border-[color:var(--card-border)] bg-[color:var(--card-soft-bg)] px-4 py-3">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-muted)]">Impact</div>
                <div className="space-y-1">
                  {impacts.map((item: string, i: number) => (
                    <div key={i} className="text-[13px] text-[color:var(--text-secondary)]">{item}</div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Service health table */}
          <section className="dashboard-table-shell p-2">
            <div className="table-toolbar">
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">Service Health Matrix</h2>
                <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">Per-service error rate, latency, and AI-derived status scored by weighted anomaly</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-chip-success rounded-full px-2.5 py-1 text-[11px] font-semibold">{healthyCount}</span>
                <span className="status-chip-warning rounded-full px-2.5 py-1 text-[11px] font-semibold">{degradedCount}</span>
                <span className="status-chip-danger rounded-full px-2.5 py-1 text-[11px] font-semibold">{criticalCount}</span>
              </div>
            </div>

            <div className="overflow-auto hide-scrollbar">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="table-head-row sticky top-0 z-10">
                    <th className="table-head-cell">Service</th>
                    <th className="table-head-cell">Status</th>
                    <th className="table-head-cell text-right">Error Rate</th>
                    <th className="table-head-cell text-right">P95 Latency</th>
                    <th className="table-head-cell">Anomaly Score</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentLoading
                    ? Array.from({ length: 8 }).map((_, idx) => (
                        <tr key={`intel-skeleton-${idx}`} className="border-b border-[color:var(--card-border)]">
                          <td className="px-4 py-4"><div className="skeleton-line" /></td>
                          <td className="px-4 py-4"><div className="skeleton-line" /></td>
                          <td className="px-4 py-4"><div className="skeleton-line" /></td>
                          <td className="px-4 py-4"><div className="skeleton-line" /></td>
                          <td className="px-4 py-4"><div className="skeleton-line" /></td>
                        </tr>
                      ))
                    : null}
                  {sorted.map((svc) => {
                    const score = svc.error_rate + svc.latency_p95 * 10;
                    const maxScore = sorted[0] ? sorted[0].error_rate + sorted[0].latency_p95 * 10 : 1;
                    const barWidth = maxScore > 0 ? Math.max((score / maxScore) * 100, 4) : 4;
                    const status = getServiceStatus(svc);
                    const barColor = status === "critical" ? "#dc4d5d" : status === "degraded" ? "#dd9b2a" : "#26b04d";

                    return (
                      <tr key={svc.service} className="table-row-hover border-b border-[color:var(--card-border)] text-[13px] last:border-b-0">
                        <td className="px-4 py-4 font-semibold text-[color:var(--text-primary)]">{svc.service}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={status} size="sm" />
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[color:var(--text-secondary)]">{svc.error_rate.toFixed(2)}%</td>
                        <td className="px-4 py-4 text-right font-semibold text-[color:var(--text-secondary)]">{formatDuration(svc.latency_p95)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-[color:var(--control-bg)]">
                              <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: barColor }} />
                            </div>
                            <span className="w-8 text-right text-[11px] font-semibold text-[color:var(--text-muted)]">{score.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!incidentLoading && serviceHealth.length === 0 && (
                <div className="dashboard-empty-state h-[280px]">
                  No service health data available. Ensure Prometheus is reachable and services are reporting metrics.
                </div>
              )}
            </div>
          </section>

          {/* How it works */}
          <section className="glass-card p-6">
            <h2 className="text-[16px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">How It Works</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="dashboard-card-subtle p-4">
                <div className="mb-2 text-[12px] font-semibold text-[color:var(--text-muted)]">1. Collect</div>
                <p className="text-[13px] leading-5 text-[color:var(--text-secondary)]">
                  Prometheus metrics are queried in real-time for each service — error rates (5xx ratio over 5m) and P95 latency from histogram quantiles.
                </p>
              </div>
              <div className="dashboard-card-subtle p-4">
                <div className="mb-2 text-[12px] font-semibold text-[color:var(--text-muted)]">2. Score</div>
                <p className="text-[13px] leading-5 text-[color:var(--text-secondary)]">
                  A weighted anomaly score ranks services: <code className="rounded bg-[color:var(--control-bg)] px-1 text-[12px]">error_rate + latency_p95 * 10</code>. Confidence is derived from deviation against the fleet average.
                </p>
              </div>
              <div className="dashboard-card-subtle p-4">
                <div className="mb-2 text-[12px] font-semibold text-[color:var(--text-muted)]">3. Reason</div>
                <p className="text-[13px] leading-5 text-[color:var(--text-secondary)]">
                  Gemini 2.5 Flash Lite receives the full service health context and answers natural language queries. Falls back to keyword heuristics without an API key.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right column — AI chat */}
        <div className="flex flex-col gap-5">
          <div className="glass-card flex flex-col p-5" style={{ minHeight: 480 }}>
            <h3 className="text-[16px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">Ask the System</h3>
            <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">Query service health, latency, errors, or incident context in natural language.</p>

            <div className="mt-4 flex-1 space-y-3 overflow-auto hide-scrollbar">
              {conversation.length === 0 && !loading && (
                <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-[color:var(--card-border)] px-5 text-center text-[12px] text-[color:var(--text-muted)]">
                  Ask about latency spikes, error patterns, service health, or root cause analysis.
                </div>
              )}

              {conversation.map((entry, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-[14px] bg-[color:var(--accent)] px-4 py-2.5 text-[13px] leading-5 text-[color:var(--shell-bg)]">
                      {entry.question}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-[14px] border border-[color:var(--card-border)] bg-[color:var(--card-soft-bg)] px-4 py-2.5 text-[13px] leading-5 text-[color:var(--text-secondary)]">
                      {entry.answer}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-[14px] border border-[color:var(--card-border)] bg-[color:var(--card-soft-bg)] px-4 py-2.5 text-[13px] text-[color:var(--text-muted)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
                  placeholder="What's causing latency spikes?"
                  className="dashboard-input flex-1"
                />
                <button
                  onClick={handleAsk}
                  disabled={loading || !query.trim()}
                  className="shrink-0 rounded-[14px] bg-[color:var(--accent)] px-5 py-3 text-[13px] font-semibold text-[color:var(--shell-bg)] disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {["What's the root cause?", "Which service has highest latency?", "Are there any error spikes?"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setQuery(suggestion); }}
                  className="rounded-[10px] border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-1.5 text-[11px] text-[color:var(--text-secondary)] hover:bg-[color:var(--control-bg-hover)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Model info */}
          <div className="glass-card p-5">
            <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)]">Model Configuration</h3>
            <div className="mt-4 space-y-3 text-[12px]">
              <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
                <span className="text-[color:var(--text-muted)]">Provider</span>
                <span className="font-semibold text-[color:var(--text-primary)]">Google Gemini</span>
              </div>
              <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
                <span className="text-[color:var(--text-muted)]">Model</span>
                <span className="font-semibold text-[color:var(--text-primary)]">Gemini 2.5 Flash Lite</span>
              </div>
              <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
                <span className="text-[color:var(--text-muted)]">Max Tokens</span>
                <span className="font-semibold text-[color:var(--text-primary)]">300</span>
              </div>
              <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
                <span className="text-[color:var(--text-muted)]">Context</span>
                <span className="font-semibold text-[color:var(--text-primary)]">Live Prometheus metrics</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text-muted)]">Fallback</span>
                <span className="font-semibold text-[color:var(--text-primary)]">Keyword heuristics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
