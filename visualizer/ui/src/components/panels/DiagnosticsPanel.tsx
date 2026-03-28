"use client";

import { Activity, Server, TerminalSquare } from "lucide-react";
import { useHealth } from "@/hooks/useHealth";
import { useSimulationStatus } from "@/hooks/useSimulation";

const statusColor: Record<string, string> = {
  idle: "text-[#7a7a7a]",
  running: "text-[#5d88dd]",
  completed: "text-[#46a064]",
  failed: "text-[#ca6870]",
};

export default function DiagnosticsPanel() {
  const { data: health } = useHealth();
  const { data: simulation } = useSimulationStatus();

  const recentLogs = simulation?.logs?.slice(-8).reverse() || [];
  const simStatus = simulation?.status || "idle";

  return (
    <div className="glass-card flex flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <Server className="h-4 w-4 text-[#5f86d9]" />
        <h3 className="text-[15px] font-semibold text-[#2c2c2c]">Diagnostics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="dashboard-card-subtle p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#8b8b8b]">
            <Activity className="h-4 w-4 text-[#4aa067]" />
            API Health
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-[#1f1f1f]">
            {health?.status === "ok" ? "Online" : "Offline"}
          </div>
        </div>

        <div className="dashboard-card-subtle p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#8b8b8b]">
            <TerminalSquare className="h-4 w-4 text-[#5f86d9]" />
            Simulation
          </div>
          <div className={`mt-2 text-[22px] font-semibold tracking-[-0.04em] capitalize ${statusColor[simStatus]}`}>
            {simStatus}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[18px] border border-[#efebe5] bg-white/74">
        <div className="border-b border-[#f1eeea] px-4 py-3 text-[12px] font-medium text-[#8b8b8b]">Dependency Status</div>
        <div className="space-y-2 px-4 py-3 text-[12px] text-[#666]">
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
        <div className="mt-4 overflow-hidden rounded-[18px] border border-[#efebe5] bg-white/74">
          <div className="border-b border-[#f1eeea] px-4 py-3 text-[12px] font-medium text-[#8b8b8b]">
            Simulation Log
          </div>
          <div className="max-h-[200px] overflow-y-auto px-4 py-3 hide-scrollbar">
            {recentLogs.map((line, index) => (
              <div key={`${index}-${line}`} className="font-mono text-[11px] leading-5 text-[#666]">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
