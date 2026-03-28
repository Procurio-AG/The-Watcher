"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { startAttackResolveSimulation, useSimulationStatus } from "@/hooks/useSimulation";

const tone: Record<string, string> = {
  idle: "bg-[color:var(--control-bg)] text-[color:var(--text-secondary)]",
  running: "status-chip-info",
  completed: "status-chip-success",
  failed: "status-chip-danger",
};

export default function SimulationControl() {
  const { data, mutate } = useSimulationStatus();
  const [starting, setStarting] = useState(false);

  const running = data?.status === "running";

  const handleStart = async () => {
    if (running || starting) return;
    setStarting(true);
    try {
      await startAttackResolveSimulation();
      await mutate();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone[data?.status || "idle"]}`}>
        {data?.status || "idle"}
      </span>
      <button
        onClick={handleStart}
        disabled={running || starting}
        className="dashboard-select inline-flex items-center gap-2 border-[color:var(--card-border)] bg-[color:var(--control-bg)] px-4 py-2 font-semibold text-[color:var(--text-primary)] transition-all hover:bg-[color:var(--control-bg-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {running || starting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Zap className="h-3.5 w-3.5 text-[#e67e22]" />
        )}
        {running ? "Attacking..." : "Run Attack"}
      </button>
    </div>
  );
}
