"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { startAttackResolveSimulation, useSimulationStatus } from "@/hooks/useSimulation";

const tone: Record<string, string> = {
  idle: "bg-white/70 text-[#666]",
  running: "bg-[#e9f0ff] text-[#4f74c9]",
  completed: "bg-[#eef9ef] text-[#2f8d53]",
  failed: "bg-[#fff0f1] text-[#c45d67]",
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
      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${tone[data?.status || "idle"]}`}>
        {(data?.status || "idle")}
      </span>
      <button
        onClick={handleStart}
        disabled={running || starting}
        className="glass-pill-active inline-flex items-center gap-2 px-4 py-2 text-[12px] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {running || starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        Run Attack & Resolve
      </button>
    </div>
  );
}
