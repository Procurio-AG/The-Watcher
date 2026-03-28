"use client";

import { Sparkles } from "lucide-react";
import { useCurrentIncident } from "@/hooks/useIncidents";

export default function AIIncidentPanel() {
  const { data } = useCurrentIncident();

  if (!data) {
    return (
      <div className="mock-panel flex h-full animate-pulse flex-col p-5">
        <div className="mb-4 h-5 w-40 rounded-full bg-slate-100" />
        <div className="mb-3 h-10 w-64 rounded-2xl bg-slate-100" />
        <div className="h-full rounded-[24px] bg-slate-100" />
      </div>
    );
  }

  const impacts = data.impact?.slice(0, 2) || [];

  return (
    <div className="mock-panel flex h-full flex-col p-5">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 items-center gap-2 rounded-full bg-[#536699] px-3 text-white shadow-[0_12px_24px_rgba(83,102,153,0.22)]">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">AI</span>
        </div>
        <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#54514b]">
          Incident Analysis
        </span>
      </div>

      <h3 className="mb-4 text-[18px] font-medium tracking-[-0.03em] text-[#1f1f21]">
        Root Cause Identified
      </h3>

      <div className="ai-analysis-gradient relative flex flex-1 flex-col overflow-hidden rounded-[26px] border border-white/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
        <div className="ai-analysis-overlay absolute inset-0" />
        <div className="relative">
          <div className="mb-4">
            <p className="text-[16px] font-semibold text-[#252526]">{data.root_cause_service}</p>
            <p className="mt-2 text-[14px] text-[#3f3d39]">
              Confidence: <span className="font-semibold">{data.confidence}%</span>
            </p>
          </div>

          <div className="glass-sheen rounded-[22px] border border-white/70 p-4 shadow-[0_18px_34px_rgba(118,112,96,0.12)] backdrop-blur-sm">
            <p className="mb-3 text-[14px] font-semibold text-[#2a2928]">Impact:</p>
            <div className="space-y-2.5">
              {impacts.length > 0 ? (
                impacts.map((item: string, index: number) => (
                  <div key={item} className="flex items-center gap-3 text-[14px] text-[#504d47]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[12px] font-semibold text-[#cf7980]">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 text-[14px] text-[#504d47]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[12px] font-semibold text-[#68b27d]">
                    1
                  </span>
                  <span>System operating within normal parameters</span>
                </div>
              )}
            </div>

            <div className="my-4 h-px bg-white/70" />

            <p className="mb-3 text-[14px] font-semibold text-[#2a2928]">Action:</p>
            <p className="text-[14px] text-[#34322f]">{data.remediation}</p>

            <div className="mt-5">
              <p className="text-[13px] text-[#6f6b66]">Fix Time</p>
              <p className="text-[16px] font-semibold text-[#252526]">
                {data.fix_time_seconds ? `${data.fix_time_seconds}s` : "Stable"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[#7d776e]">
            *AI analysis based on logs and traces.
          </p>
        </div>
      </div>
    </div>
  );
}
