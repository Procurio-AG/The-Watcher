"use client";

import { Sparkles } from "lucide-react";
import { useCurrentIncident } from "@/hooks/useIncidents";

const severityTone: Record<string, string> = {
  healthy: "bg-[rgba(143,254,1,0.15)] text-[#3a7a00]",
  degraded: "bg-[rgba(245,158,11,0.15)] text-[#b58124]",
  critical: "bg-[rgba(239,68,68,0.15)] text-[#c45d67]",
};

export default function AIIncidentPanel() {
  const { data } = useCurrentIncident();

  const severity = data?.severity || "healthy";
  const rootCause = data?.root_cause_service || "No critical service";
  const confidence = data?.confidence ?? 98;
  const impacts = data?.impact || ["System operating within normal parameters"];
  const remediation = data?.remediation || "No action needed";
  const fixTime = data?.fix_time_seconds;

  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#7201FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_16px_rgba(114,1,255,0.25)]">
          <Sparkles className="h-3.5 w-3.5" />
          AI Incident Analysis
        </span>
      </div>

      <h3 className="text-[20px] font-bold tracking-[-0.04em] text-[#1a1a1a]">Root Cause Identified</h3>

      <div className="insight-gradient mt-5 flex flex-1 rounded-[24px] p-[1px]">
        <div className="insight-overlay flex flex-1 flex-col rounded-[23px] border border-white/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] text-[#666]">Service</div>
              <div className="mt-1 text-[28px] font-bold tracking-[-0.05em] text-[#1a1a1a]">{rootCause}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${severityTone[severity] || severityTone.healthy}`}>
              {confidence}% confidence
            </span>
          </div>

          <div className="mt-5 rounded-[18px] border border-white/40 bg-white/50 p-4 backdrop-blur-sm">
            <div className="text-[13px] font-bold text-[#333]">Impact</div>
            <div className="mt-3 space-y-2">
              {impacts.map((item: string, index: number) => (
                <div key={`${item}-${index}`} className="flex items-center gap-3 text-[13px] text-[#555]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(114,1,255,0.08)] text-[11px] font-bold text-[#7201FF]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-white/40 pt-4">
              <div className="text-[13px] font-bold text-[#333]">Action</div>
              <div className="mt-2 text-[13px] text-[#555]">{remediation}</div>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <div className="text-[12px] text-[#888]">Fix Time</div>
              <div className="mt-1 text-[22px] font-bold tracking-[-0.04em] text-[#1a1a1a]">
                {fixTime ? `${fixTime}s` : "Stable"}
              </div>
            </div>
            <div className="text-right text-[11px] text-[#999]">AI analysis based on live metrics</div>
          </div>
        </div>
      </div>
    </div>
  );
}
