"use client";

import { useState } from "react";
import { Loader2, Play, Zap } from "lucide-react";
import { startAttackResolveSimulation, useSimulationStatus } from "@/hooks/useSimulation";

const tone: Record<string, string> = {
  idle: "bg-[#f3f2ef] text-[#7a7a7a]",
  running: "bg-[#eef4ff] text-[#5d88dd]",
  completed: "bg-[#ecf8ef] text-[#46a064]",
  failed: "bg-[#fff0f1] text-[#ca6870]",
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
        className="glass-pill inline-flex items-center gap-2 border-[#e7e2db] bg-white px-4 py-2 font-semibold text-[#303030] transition-all hover:border-[#d4cfc7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
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
