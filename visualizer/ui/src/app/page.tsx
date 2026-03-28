"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Loader2, Search, Sparkles, AlertTriangle, CheckCircle2, Train } from "lucide-react";
import { useOverview, useLatencySeries, useErrorSeries, type MetricsRange } from "@/hooks/useMetrics";
import { useCurrentIncident, askAI } from "@/hooks/useIncidents";
import SimulationControl from "@/components/panels/SimulationControl";
import { apiFetch } from "@/lib/api";
import { formatDuration, trendArrow } from "@/lib/utils";

/* ── Service Coach Mapping ── */
const SERVICE_COACHES = [
  { label: "AUTH", service: "auth-service", route: "/auth" },
  { label: "GATE", service: "gateway-service", route: "/gateway" },
  { label: "USER", service: "user-service", route: "/user" },
  { label: "TICK", service: "ticket-service", route: "/ticket" },
  { label: "PAY", service: "payment-service", route: "/payment" },
  { label: "NOTIF", service: "notification-service", route: "/notify" },
  { label: "SCHED", service: "schedule-service", route: "/schedule" },
  { label: "TRAIN", service: "train-service", route: "/train" },
  { label: "ORDER", service: "order-service", route: "/order" },
  { label: "STN", service: "station-service", route: "/station" },
];

/* ── Gantt Data ── */
const GANTT_ROWS = [
  { service: "gateway-service", spans: [{ start: 0, width: 85, label: "Request routing" }] },
  { service: "auth-service", spans: [{ start: 5, width: 30, label: "Token verify" }, { start: 50, width: 35, label: "Session refresh" }] },
  { service: "ticket-service", spans: [{ start: 15, width: 55, label: "Booking pipeline" }] },
  { service: "payment-service", spans: [{ start: 35, width: 45, label: "Payment processing" }] },
  { service: "train-service", spans: [{ start: 10, width: 40, label: "Schedule lookup" }] },
  { service: "order-service", spans: [{ start: 20, width: 60, label: "Order management" }] },
];

export default function SystemOverviewPage() {
  const { data: overview } = useOverview();
  const [range, setRange] = useState<MetricsRange>("15m");
  const { data: latencyData } = useLatencySeries(range);
  const { data: errorSeries } = useErrorSeries(range);
  const { data: incident } = useCurrentIncident();
  const { data: services } = useSWR("/api/services", (p: string) => apiFetch<any[]>(p), { refreshInterval: 10000 });

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const chartData = (latencyData?.p95 || []).map((p) => ({
    time: p.timestamp * 1000,
    p95: p.value,
  }));

  const severity = incident?.severity || "healthy";
  const rootCause = incident?.root_cause_service || "All clear";

  const handleAsk = async () => {
    if (!question.trim() || asking) return;
    setAsking(true);
    try {
      const res = await askAI(question);
      setAnswer(res.answer);
    } catch {
      setAnswer("Unable to analyze right now.");
    } finally {
      setAsking(false);
    }
  };

  const topErrors = (errorSeries || [])
    .map((s) => ({ service: s.service, value: s.values?.[s.values.length - 1]?.value || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const serviceList = services || [];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto overflow-x-hidden pb-6 pt-1 hide-scrollbar">

      {/* ══════════ TOP ROW: Hero Train + Service Health ══════════ */}
      <div className="grid min-h-[340px] grid-cols-[minmax(0,1.8fr)_380px] gap-4 animate-fade-in">

        {/* ── Hero: WAP-7 Locomotive with Coaches ── */}
        <div className="glass-card-hero relative flex flex-col overflow-hidden p-6">
          {/* Header */}
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="badge-violet">LIVE</span>
                <span className="badge-neon">{overview?.active_services || 0} Services</span>
              </div>
              <h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.05em] text-[#1a1a1a]">
                System Overview
              </h1>
              <p className="mt-1 text-[14px] text-[#888]">
                Indian Railway Microservices Observability Platform
              </p>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-2">
              <div className="glass-pill">
                <span className="text-[11px] text-[#999]">Range</span>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as MetricsRange)}
                  className="bg-transparent text-[13px] font-semibold text-[#333] outline-none"
                >
                  <option value="15m">15 min</option>
                  <option value="1h">1 hour</option>
                  <option value="6h">6 hours</option>
                </select>
              </div>
              <SimulationControl />
            </div>
          </div>

          {/* ── WAP-7 Locomotive SVG ── */}
          <div className="relative mt-4 flex-1">
            <svg viewBox="0 0 920 160" className="h-full w-full animate-train-glow" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="locoBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7201FF" />
                  <stop offset="100%" stopColor="#5000B8" />
                </linearGradient>
                <linearGradient id="coachBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                  <stop offset="100%" stopColor="rgba(245,243,240,0.75)" />
                </linearGradient>
                <filter id="glowFilter">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#7201FF" floodOpacity="0.25" />
                </filter>
                <filter id="headlightGlow">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>

              {/* Track / Rail */}
              <line x1="0" y1="148" x2="920" y2="148" stroke="#D3D3D3" strokeWidth="3" />
              <line x1="0" y1="152" x2="920" y2="152" stroke="#bbb" strokeWidth="1.5" />

              {/* ── Locomotive (WAP-7) ── */}
              <g filter="url(#glowFilter)">
                {/* Main body */}
                <rect x="10" y="60" width="130" height="75" rx="8" fill="url(#locoBody)" />
                {/* Cab front (angled) */}
                <polygon points="10,60 10,135 2,125 2,70" fill="#5a00cc" />
                {/* Windshield */}
                <rect x="16" y="68" width="38" height="22" rx="4" fill="rgba(255,255,255,0.2)" />
                <rect x="18" y="70" width="34" height="18" rx="3" fill="rgba(200,220,255,0.3)" />
                {/* Headlight */}
                <circle cx="6" cy="90" r="6" fill="#8FFE01" opacity="0.9" />
                <circle cx="6" cy="90" r="14" fill="#8FFE01" opacity="0.12" filter="url(#headlightGlow)" />
                {/* Number plate */}
                <rect x="60" y="72" width="64" height="16" rx="3" fill="rgba(0,0,0,0.15)" />
                <text x="92" y="84" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Urbanist">WAP-7</text>
                {/* Stripe */}
                <rect x="10" y="100" width="130" height="4" fill="#8FFE01" opacity="0.7" />
                {/* Pantograph */}
                <line x1="70" y1="60" x2="60" y2="32" stroke="#888" strokeWidth="2" />
                <line x1="60" y1="32" x2="90" y2="20" stroke="#888" strokeWidth="2" />
                <line x1="80" y1="60" x2="90" y2="32" stroke="#888" strokeWidth="1.5" />
                <line x1="90" y1="32" x2="90" y2="20" stroke="#888" strokeWidth="1.5" />
                {/* Overhead wire */}
                <line x1="0" y1="18" x2="920" y2="18" stroke="#aaa" strokeWidth="1" strokeDasharray="8,4" />
                {/* Wheels */}
                <circle cx="40" cy="142" r="8" fill="#333" stroke="#555" strokeWidth="2" />
                <circle cx="70" cy="142" r="8" fill="#333" stroke="#555" strokeWidth="2" />
                <circle cx="105" cy="142" r="8" fill="#333" stroke="#555" strokeWidth="2" />
              </g>

              {/* ── Coaches with Compartment Grid ── */}
              {SERVICE_COACHES.map((coach, i) => {
                const x = 155 + i * 76;
                const svc = serviceList.find((s: any) => s.name === coach.service);
                const status = svc?.status || "healthy";
                const fillColor = status === "critical" ? "rgba(239,68,68,0.12)"
                  : status === "degraded" ? "rgba(245,158,11,0.12)"
                  : "rgba(114,1,255,0.04)";
                const borderColor = status === "critical" ? "rgba(239,68,68,0.4)"
                  : status === "degraded" ? "rgba(245,158,11,0.4)"
                  : "rgba(114,1,255,0.15)";

                return (
                  <g key={coach.label}>
                    {/* Coach body */}
                    <rect x={x} y="62" width="70" height="73" rx="6" fill="url(#coachBody)" stroke={borderColor} strokeWidth="1.5" />
                    {/* Status fill overlay */}
                    <rect x={x} y="62" width="70" height="73" rx="6" fill={fillColor} />
                    {/* Compartment grid: 2x3 */}
                    {[0, 1, 2].map((col) =>
                      [0, 1].map((row) => (
                        <rect
                          key={`${col}-${row}`}
                          x={x + 5 + col * 22}
                          y={68 + row * 28}
                          width="18"
                          height="22"
                          rx="3"
                          fill={status === "critical" ? "rgba(239,68,68,0.15)"
                            : status === "degraded" ? "rgba(245,158,11,0.1)"
                            : "rgba(114,1,255,0.06)"}
                          stroke={borderColor}
                          strokeWidth="0.5"
                        />
                      ))
                    )}
                    {/* Coach label */}
                    <text x={x + 35} y="128" textAnchor="middle" fill={status === "critical" ? "#ef4444" : status === "degraded" ? "#d97706" : "#7201FF"} fontSize="9" fontWeight="700" fontFamily="Urbanist" letterSpacing="0.08em">
                      {coach.label}
                    </text>
                    {/* Coupling */}
                    {i < SERVICE_COACHES.length - 1 && (
                      <line x1={x + 70} y1="98" x2={x + 76} y2="98" stroke="#bbb" strokeWidth="2" />
                    )}
                    {/* Wheels */}
                    <circle cx={x + 18} cy="142" r="6" fill="#444" stroke="#666" strokeWidth="1.5" />
                    <circle cx={x + 52} cy="142" r="6" fill="#444" stroke="#666" strokeWidth="1.5" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Stats bar */}
          <div className="mt-3 flex items-center gap-6 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7201FF]" />
              <span className="text-[#777]">P95 Latency</span>
              <span className="font-bold text-[#1a1a1a]">{formatDuration(overview?.latency_p95 || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#8FFE01]" />
              <span className="text-[#777]">Error Rate</span>
              <span className="font-bold text-[#1a1a1a]">{overview?.error_rate?.toFixed(1) || "0.0"}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D3D3D3]" />
              <span className="text-[#777]">Throughput</span>
              <span className="font-bold text-[#1a1a1a]">{overview?.rps?.toFixed(0) || "0"} req/s</span>
            </div>
          </div>
        </div>

        {/* ── Service Health Panel (Load Planning style) ── */}
        <div className="glass-card-dark flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16px] font-bold tracking-[-0.03em] text-[#1a1a1a]">Service Health</h3>
            <span className="badge-violet text-[10px]">
              <Sparkles className="mr-1 h-3 w-3" />
              AI Monitored
            </span>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
            {serviceList.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-[#999]">
                Waiting for service data...
              </div>
            ) : (
              serviceList.map((svc: any) => {
                const statusColor = svc.status === "critical" ? "#ef4444"
                  : svc.status === "degraded" ? "#f59e0b" : "#22c55e";
                return (
                  <div
                    key={svc.name}
                    className="table-row-hover flex items-center justify-between rounded-[14px] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor }} />
                      <span className="text-[13px] font-medium text-[#333]">{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-[#888]">
                      <span>{svc.latency_p95?.toFixed(0) || 0}ms</span>
                      <span className="font-semibold" style={{ color: svc.error_rate > 5 ? "#ef4444" : "#666" }}>
                        {svc.error_rate?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Incident Summary */}
          <div className="mt-3 rounded-[16px] border border-[rgba(114,1,255,0.1)] bg-[rgba(114,1,255,0.03)] p-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7201FF]">
              {severity === "critical" ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {severity === "critical" ? "Incident Active" : severity === "degraded" ? "Degraded" : "All Systems Nominal"}
            </div>
            <p className="mt-1 text-[12px] text-[#666]">
              Root cause: <span className="font-semibold text-[#333]">{rootCause}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ══════════ MIDDLE ROW: Latency Chart + AI Query ══════════ */}
      <div className="grid min-h-[280px] grid-cols-[minmax(0,1.6fr)_380px] gap-4" style={{ animationDelay: "0.1s" }}>

        {/* ── Latency Chart ── */}
        <div className="glass-card flex flex-col p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#1a1a1a]">Service Latency (P95)</h3>
              <p className="mt-0.5 text-[12px] text-[#999]">Live latency across the selected time window</p>
            </div>
            <span className="rounded-full bg-[rgba(114,1,255,0.08)] px-3 py-1 text-[11px] font-bold text-[#7201FF]">{range}</span>
          </div>

          <div className="min-h-0 flex-1" style={{ minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: -18 }}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7201FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7201FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="0" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(v) => format(new Date(v), "h:mm a")}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#aaa", fontSize: 11 }}
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={(v) => (v >= 1 ? `${v.toFixed(0)}s` : `${Math.round(v * 1000)}ms`)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#aaa", fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(v) => format(new Date(v), "h:mm:ss a")}
                  formatter={(value: number) => [formatDuration(value), "P95"]}
                  contentStyle={{
                    borderRadius: "14px",
                    border: "1px solid rgba(114,1,255,0.15)",
                    background: "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    padding: "8px 12px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="p95" stroke="#7201FF" strokeWidth={2.5} fill="url(#latencyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── AI Explore Panel ── */}
        <div className="glass-card-dark flex flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#7201FF]" />
            <h3 className="text-[15px] font-bold text-[#1a1a1a]">Explore Further</h3>
          </div>
          <p className="mb-4 text-[12px] text-[#999]">Ask the AI incident analyzer about your services</p>

          <div className="flex items-center gap-2 rounded-[16px] border border-white/40 bg-white/60 px-3 py-2.5 backdrop-blur-sm">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
              placeholder="Ask about latency, errors, services..."
              className="flex-1 bg-transparent text-[13px] text-[#333] outline-none placeholder:text-[#aaa]"
            />
            <button
              onClick={handleAsk}
              disabled={asking}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7201FF] text-white shadow-[0_4px_12px_rgba(114,1,255,0.3)] transition hover:shadow-[0_6px_20px_rgba(114,1,255,0.4)] disabled:opacity-60"
            >
              {asking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            </button>
          </div>

          {answer ? (
            <div className="mt-3 flex-1 rounded-[16px] border border-[rgba(114,1,255,0.1)] bg-[rgba(114,1,255,0.03)] p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7201FF]">
                <Sparkles className="h-3 w-3" /> AI Response
              </div>
              <p className="text-[13px] leading-[1.6] text-[#555]">{answer}</p>
            </div>
          ) : (
            <div className="mt-3 flex flex-1 items-center rounded-[16px] border border-dashed border-white/30 px-4 text-[12px] text-[#aaa]">
              Ask about latency spikes, error patterns, unhealthy services, or incident severity.
            </div>
          )}

          {/* Top Errors mini */}
          <div className="mt-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999]">Top Error Sources</div>
            <div className="space-y-1.5">
              {topErrors.slice(0, 3).map((item) => (
                <div key={item.service} className="flex items-center justify-between text-[12px]">
                  <span className="truncate text-[#666]">{item.service}</span>
                  <span className="font-bold text-[#7201FF]">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ GANTT CHART TIMELINE ══════════ */}
      <div className="glass-card p-5 animate-stagger-in" style={{ animationDelay: "0.2s" }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#1a1a1a]">Service Activity Timeline</h3>
            <p className="mt-0.5 text-[12px] text-[#999]">Request flow across microservices — Gantt view</p>
          </div>
          <span className="badge-neon text-[10px]">
            <Train className="mr-1 h-3 w-3" /> Live
          </span>
        </div>

        {/* Timeline grid */}
        <div className="relative">
          {/* Time axis */}
          <div className="mb-2 flex items-center pl-[140px]">
            {["0ms", "200ms", "400ms", "600ms", "800ms", "1s"].map((t) => (
              <span key={t} className="flex-1 text-[10px] text-[#bbb]">{t}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {GANTT_ROWS.map((row) => (
              <div key={row.service} className="flex items-center gap-3">
                <span className="w-[128px] shrink-0 truncate text-right text-[12px] font-medium text-[#666]">
                  {row.service.replace("-service", "")}
                </span>
                <div className="relative h-[28px] flex-1 rounded-[6px] bg-[rgba(114,1,255,0.03)]">
                  {row.spans.map((span, si) => (
                    <div
                      key={si}
                      className={si === 0 ? "gantt-bar" : "gantt-bar-outline"}
                      style={{
                        position: "absolute",
                        left: `${span.start}%`,
                        width: `${span.width}%`,
                        top: 0,
                      }}
                    >
                      {span.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ BOTTOM: Service Cards with Train Silhouettes ══════════ */}
      <div className="animate-stagger-in" style={{ animationDelay: "0.3s" }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">Fleet Overview</h3>
          <span className="text-[12px] text-[#999]">{serviceList.length} services tracked</span>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {SERVICE_COACHES.slice(0, 10).map((coach) => {
            const svc = serviceList.find((s: any) => s.name === coach.service);
            const status = svc?.status || "healthy";
            const isActive = status !== "healthy";

            return (
              <div
                key={coach.label}
                className={`service-card p-4 ${isActive ? "service-card-active" : ""}`}
              >
                {/* Mini train silhouette */}
                <svg viewBox="0 0 80 24" className="mb-2 h-6 w-full opacity-30">
                  <rect x="0" y="4" width="18" height="14" rx="3" fill="#7201FF" />
                  <rect x="20" y="6" width="14" height="12" rx="2" fill="#D3D3D3" />
                  <rect x="36" y="6" width="14" height="12" rx="2" fill="#D3D3D3" />
                  <rect x="52" y="6" width="14" height="12" rx="2" fill="#D3D3D3" />
                  <line x1="0" y1="20" x2="80" y2="20" stroke="#ddd" strokeWidth="1" />
                  <circle cx="8" cy="20" r="2.5" fill="#999" />
                  <circle cx="28" cy="20" r="2" fill="#aaa" />
                  <circle cx="44" cy="20" r="2" fill="#aaa" />
                  <circle cx="60" cy="20" r="2" fill="#aaa" />
                </svg>

                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#333]">{coach.label}</span>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: status === "critical" ? "#ef4444"
                        : status === "degraded" ? "#f59e0b" : "#22c55e",
                    }}
                  />
                </div>
                <p className="mt-1 truncate text-[11px] text-[#999]">{coach.service}</p>
                {svc && (
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#888]">
                    <span>{svc.latency_p95?.toFixed(0) || 0}ms</span>
                    <span className="font-semibold" style={{ color: svc.error_rate > 5 ? "#ef4444" : "#666" }}>
                      {svc.error_rate?.toFixed(1) || 0}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
