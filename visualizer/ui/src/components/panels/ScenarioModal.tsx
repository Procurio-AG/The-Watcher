"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Zap,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { startAttackResolveSimulation, useSimulationStatus } from "@/hooks/useSimulation";

type Phase = "idle" | "starting" | "baseline" | "error-attack" | "latency-attack" | "recovery" | "resolved";

const PHASE_META: Record<Phase, { label: string; icon: any; color: string; chipClass: string; description: string }> = {
  idle: {
    label: "Ready",
    icon: Zap,
    color: "var(--text-secondary)",
    chipClass: "bg-[color:var(--control-bg)] text-[color:var(--text-secondary)]",
    description: "Launch an attack-and-resolve simulation to see The Watcher in action.",
  },
  starting: {
    label: "Initializing",
    icon: Loader2,
    color: "var(--status-info-text)",
    chipClass: "status-chip-info",
    description: "Connecting to the gateway and preparing chaos triggers...",
  },
  baseline: {
    label: "Phase 1 — Baseline",
    icon: Activity,
    color: "var(--status-info-text)",
    chipClass: "status-chip-info",
    description: "Establishing normal traffic patterns across all services. This sets the healthy reference point.",
  },
  "error-attack": {
    label: "Phase 2 — Error Injection",
    icon: AlertTriangle,
    color: "var(--status-danger-text)",
    chipClass: "status-chip-danger",
    description: "Injecting HTTP 500 errors into the Notification Service via x-chaos-trigger headers. Watch the error rate spike on the dashboard.",
  },
  "latency-attack": {
    label: "Phase 3 — Latency Attack",
    icon: Clock,
    color: "var(--status-warning-text)",
    chipClass: "status-chip-warning",
    description: "Injecting 10-second blocking delays into the Payment Service. P95 latency will spike dramatically.",
  },
  recovery: {
    label: "Phase 4 — Recovery",
    icon: Shield,
    color: "var(--status-success-text)",
    chipClass: "status-chip-success",
    description: "Attack stopped. Sending clean traffic to verify services self-heal. Metrics should return to baseline.",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    color: "var(--status-success-text)",
    chipClass: "status-chip-success",
    description: "All services have recovered. The incident lifecycle is complete — review the dashboard for the full story.",
  },
};

function detectPhase(logs: string[]): Phase {
  const joined = logs.join("\n");
  if (joined.includes("Recovery complete") || joined.includes("Attack Simulation Complete")) return "resolved";
  if (joined.includes("[4/4] Recovery")) return "recovery";
  if (joined.includes("[3/4] ATTACK: Latency")) return "latency-attack";
  if (joined.includes("[2/4] ATTACK: Error")) return "error-attack";
  if (joined.includes("[1/4] Baseline")) return "baseline";
  if (logs.length > 0) return "starting";
  return "idle";
}

interface ScenarioModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ScenarioModal({ open, onClose }: ScenarioModalProps) {
  const { data, mutate } = useSimulationStatus();
  const [localPhase, setLocalPhase] = useState<Phase>("idle");
  const [hasStarted, setHasStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const logs = data?.logs || [];
  const simStatus = data?.status || "idle";

  // Detect phase from logs
  useEffect(() => {
    if (simStatus === "running" || simStatus === "completed") {
      setLocalPhase(detectPhase(logs));
    } else if (simStatus === "failed") {
      setLocalPhase("idle");
    }
  }, [logs, simStatus]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  // Poll faster while running
  useEffect(() => {
    if (!open || simStatus !== "running") return;
    const interval = setInterval(() => mutate(), 1500);
    return () => clearInterval(interval);
  }, [open, simStatus, mutate]);

  const handleStart = async () => {
    if (isStarting || simStatus === "running") return;
    setIsStarting(true);
    setHasStarted(true);
    setLocalPhase("starting");
    try {
      await startAttackResolveSimulation();
      await mutate();
    } finally {
      setIsStarting(false);
    }
  };

  const handleClose = () => {
    onClose();
    if (simStatus !== "running") {
      setHasStarted(false);
      setLocalPhase("idle");
    }
  };

  if (!open) return null;

  const meta = PHASE_META[localPhase];
  const PhaseIcon = meta.icon;
  const isRunning = simStatus === "running";
  const isComplete = localPhase === "resolved";

  // Phase progress
  const phaseOrder: Phase[] = ["baseline", "error-attack", "latency-attack", "recovery", "resolved"];
  const currentIdx = phaseOrder.indexOf(localPhase);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: "fadeIn 200ms ease" }} />

      {/* Modal */}
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-[680px] flex-col overflow-hidden border"
        style={{
          borderRadius: "var(--radius-card)",
          borderColor: "var(--card-border)",
          background: "var(--card-bg)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
          animation: "modalIn 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[14px]"
              style={{ background: "var(--control-bg)" }}
            >
              <Zap className="h-5 w-5" style={{ color: isRunning ? "var(--status-warning-text)" : "var(--text-secondary)" }} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>
                Attack & Resolve Scenario
              </h2>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
                Chaos engineering simulation with live recovery
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[color:var(--control-bg)]"
          >
            <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Phase indicator bar */}
        {hasStarted && (
          <div className="flex items-center gap-0 border-b px-6 py-3" style={{ borderColor: "var(--card-border)" }}>
            {phaseOrder.map((p, i) => {
              const done = currentIdx > i;
              const active = currentIdx === i;
              const pMeta = PHASE_META[p];
              return (
                <div key={p} className="flex items-center">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: done
                          ? "var(--status-success-bg)"
                          : active
                            ? pMeta.chipClass.includes("danger")
                              ? "var(--status-danger-bg)"
                              : pMeta.chipClass.includes("warning")
                                ? "var(--status-warning-bg)"
                                : "var(--status-info-bg)"
                            : "var(--control-bg)",
                        color: done
                          ? "var(--status-success-text)"
                          : active
                            ? pMeta.color
                            : "var(--text-muted)",
                      }}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span
                      className="hidden text-[11px] font-semibold sm:inline"
                      style={{ color: done || active ? "var(--text-secondary)" : "var(--text-muted)" }}
                    >
                      {p === "error-attack" ? "Errors" : p === "latency-attack" ? "Latency" : p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  </div>
                  {i < phaseOrder.length - 1 && (
                    <div className="mx-2 h-px w-4" style={{ background: done ? "var(--status-success-text)" : "var(--card-border)" }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 hide-scrollbar">
          {/* Current phase banner */}
          <div
            className="mb-5 flex items-start gap-4 rounded-[20px] border p-5"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--card-soft-bg)",
            }}
          >
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px]"
              style={{
                background: isComplete ? "var(--status-success-bg)" : isRunning ? "var(--status-warning-bg)" : "var(--control-bg)",
              }}
            >
              <PhaseIcon
                className={`h-5 w-5 ${localPhase === "starting" || isRunning ? "animate-spin" : ""}`}
                style={{
                  color: meta.color,
                  animation: localPhase === "starting" || (isRunning && localPhase !== "resolved") ? "spin 1.2s linear infinite" : "none",
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${meta.chipClass}`}>
                  {meta.label}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>
                {meta.description}
              </p>
            </div>
          </div>

          {/* Live log stream */}
          {hasStarted && logs.length > 0 && (
            <div
              className="overflow-hidden rounded-[18px] border"
              style={{ borderColor: "var(--card-border)", background: "var(--card-soft-bg)" }}
            >
              <div
                className="flex items-center gap-2 border-b px-4 py-3 text-[12px] font-semibold"
                style={{ borderColor: "var(--card-border)", color: "var(--text-muted)" }}
              >
                <Activity className="h-3.5 w-3.5" />
                Live Simulation Log
                {isRunning && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-[#e67e22]" />}
              </div>
              <div className="max-h-[220px] overflow-auto px-4 py-3 hide-scrollbar">
                {logs.map((line, i) => {
                  const isError = line.includes("ERROR") || line.includes("✗") || line.includes("errors");
                  const isSuccess = line.includes("✓") || line.includes("complete") || line.includes("Complete");
                  const isHeader = line.includes("━━━") || line.includes("═══");
                  return (
                    <div
                      key={`${i}-${line.slice(0, 20)}`}
                      className="font-mono text-[11px] leading-[22px]"
                      style={{
                        color: isHeader
                          ? "var(--text-primary)"
                          : isError
                            ? "var(--status-danger-text)"
                            : isSuccess
                              ? "var(--status-success-text)"
                              : "var(--text-secondary)",
                        fontWeight: isHeader ? 600 : 400,
                      }}
                    >
                      {line || "\u00A0"}
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* Resolution summary */}
          {isComplete && (
            <div
              className="mt-5 rounded-[20px] border p-5"
              style={{
                borderColor: "var(--card-border)",
                background: "var(--status-success-bg)",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "var(--status-success-text)" }} />
                <span className="text-[14px] font-semibold" style={{ color: "var(--status-success-text)" }}>
                  Incident Lifecycle Complete
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>
                The system experienced error spikes and latency degradation, then self-healed once the chaos
                injection stopped. Check the Overview dashboard to see the full impact timeline across error rates,
                latency charts, and the AI incident analysis panel.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="dashboard-card-subtle p-3 text-center">
                  <div className="text-[20px] font-semibold" style={{ color: "var(--status-danger-text)" }}>50+</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Errors Injected</div>
                </div>
                <div className="dashboard-card-subtle p-3 text-center">
                  <div className="text-[20px] font-semibold" style={{ color: "var(--status-warning-text)" }}>10s</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Latency Spike</div>
                </div>
                <div className="dashboard-card-subtle p-3 text-center">
                  <div className="text-[20px] font-semibold" style={{ color: "var(--status-success-text)" }}>Auto</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Recovery</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4" style={{ borderColor: "var(--card-border)" }}>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {isRunning ? "Simulation is running — keep the modal open or close to watch the dashboard live." : isComplete ? "You can close this modal and explore the dashboard." : "This sends real chaos traffic to your services."}
          </p>
          <div className="flex items-center gap-3">
            {isComplete && (
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-[13px] font-semibold transition"
                style={{
                  background: "var(--accent)",
                  color: "var(--shell-bg)",
                }}
              >
                View Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {!hasStarted && (
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="inline-flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-[13px] font-semibold shadow-md transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  background: "var(--accent)",
                  color: "var(--shell-bg)",
                }}
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Launch Simulation
              </button>
            )}
            {hasStarted && isRunning && (
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-[13px] font-medium transition"
                style={{
                  background: "var(--control-bg)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--card-border)",
                }}
              >
                Watch on Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
