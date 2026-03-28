"use client";

import { Activity, Server, TerminalSquare } from "lucide-react";
import { useHealth } from "@/hooks/useHealth";
import { useSimulationStatus } from "@/hooks/useSimulation";

export default function DiagnosticsPanel() {
  const { data: health } = useHealth();
  const { data: simulation } = useSimulationStatus();

  const recentLogs = simulation?.logs?.slice(-3).reverse() || [];

  return (
    <div className="glass-card flex h-full flex-col p-5">
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
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.04em] capitalize text-[#1f1f1f]">
            {simulation?.status || "idle"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-[18px] border border-[#efebe5] bg-white/74">
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

      <div className="mt-4 flex-1 overflow-hidden rounded-[18px] border border-[#efebe5] bg-white/74">
        <div className="border-b border-[#f1eeea] px-4 py-3 text-[12px] font-medium text-[#8b8b8b]">Simulation Log Tail</div>
        <div className="space-y-2 px-4 py-3">
          {recentLogs.length > 0 ? (
            recentLogs.map((line, index) => (
              <div key={`${index}-${line}`} className="font-mono text-[11px] leading-5 text-[#666]">
                {line}
              </div>
            ))
          ) : (
            <div className="text-[12px] text-[#9a9a9a]">No simulation output yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
