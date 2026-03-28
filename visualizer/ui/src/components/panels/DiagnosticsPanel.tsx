"use client";

import { Activity, Server, TerminalSquare } from "lucide-react";
import { useHealth } from "@/hooks/useHealth";
import { useSimulationStatus } from "@/hooks/useSimulation";

const statusColor: Record<string, string> = {
  idle: "text-[color:var(--text-secondary)]",
  running: "text-[color:var(--status-info-text)]",
  completed: "text-[color:var(--status-success-text)]",
  failed: "text-[color:var(--status-danger-text)]",
};

export default function DiagnosticsPanel() {
  const { data: health } = useHealth();
  const { data: simulation } = useSimulationStatus();

  const recentLogs = simulation?.logs?.slice(-8).reverse() || [];
  const simStatus = simulation?.status || "idle";

  return (
    <div className="glass-card flex flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <Server className="h-4 w-4 text-[color:var(--status-info-text)]" />
        <h3 className="text-[16px] font-semibold text-[color:var(--text-primary)]">Diagnostics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="dashboard-card-subtle p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[color:var(--text-muted)]">
            <Activity className="h-4 w-4 text-[color:var(--status-success-text)]" />
            API Health
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">
            {health?.status === "ok" ? "Online" : "Offline"}
          </div>
        </div>

        <div className="dashboard-card-subtle p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[color:var(--text-muted)]">
            <TerminalSquare className="h-4 w-4 text-[color:var(--status-info-text)]" />
            Simulation
          </div>
          <div className={`mt-2 text-[22px] font-semibold tracking-[-0.04em] capitalize ${statusColor[simStatus]}`}>
            {simStatus}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[18px] border border-[color:var(--card-border)] bg-[color:var(--card-soft-bg)]">
        <div className="border-b border-[color:var(--card-border)] px-4 py-3 text-[12px] font-medium text-[color:var(--text-muted)]">Dependency Status</div>
        <div className="space-y-2 px-4 py-3 text-[12px] text-[color:var(--text-secondary)]">
          <div className="flex items-center justify-between">
            <span>Prometheus</span>
            <span className="font-semibold capitalize">{health?.dependencies?.prometheus?.status || "unknown"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Loki</span>
            <span className="font-semibold capitalize">{health?.dependencies?.loki?.status || "unknown"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Jaeger</span>
            <span className="font-semibold capitalize">{health?.dependencies?.jaeger?.status || "unknown"}</span>
          </div>
        </div>
      </div>

      {recentLogs.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-[18px] border border-[color:var(--card-border)] bg-[color:var(--card-soft-bg)]">
          <div className="border-b border-[color:var(--card-border)] px-4 py-3 text-[12px] font-medium text-[color:var(--text-muted)]">
            Simulation Log
          </div>
          <div className="max-h-[200px] overflow-y-auto px-4 py-3 hide-scrollbar">
            {recentLogs.map((line, index) => (
              <div key={`${index}-${line}`} className="font-mono text-[11px] leading-5 text-[color:var(--text-secondary)]">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
