"use client";

import { Sparkles } from "lucide-react";
import { useCurrentIncident } from "@/hooks/useIncidents";

const severityTone: Record<string, string> = {
  healthy: "bg-[#edf8ef] text-[#459f64]",
  degraded: "bg-[#fff6e6] text-[#b98428]",
  critical: "bg-[#fff0f1] text-[#c9676f]",
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
        <span className="inline-flex items-center gap-2 rounded-full bg-[#4f67a9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
          <Sparkles className="h-3.5 w-3.5" />
          AI Incident Analysis
        </span>
      </div>

      <h3 className="text-[20px] font-semibold tracking-[-0.04em] text-[#202020]">Root Cause Identified</h3>

      <div className="insight-gradient mt-5 flex flex-1 rounded-[28px] p-[1px]">
        <div className="insight-overlay flex flex-1 flex-col rounded-[27px] border border-white/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[14px] text-[#595959]">Service</div>
              <div className="mt-1 text-[28px] font-semibold tracking-[-0.05em] text-[#202020]">{rootCause}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${severityTone[severity] || severityTone.healthy}`}>
              {confidence}% confidence
            </span>
          </div>

          <div className="mt-5 rounded-[20px] border border-white/60 bg-white/54 p-4 backdrop-blur-sm">
            <div className="text-[14px] font-semibold text-[#343434]">Impact</div>
            <div className="mt-3 space-y-2">
              {impacts.map((item: string, index: number) => (
                <div key={`${item}-${index}`} className="flex items-center gap-3 text-[14px] text-[#555]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[12px] font-semibold text-[#df7b67]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-white/70 pt-4">
              <div className="text-[14px] font-semibold text-[#343434]">Action</div>
              <div className="mt-2 text-[14px] text-[#555]">{remediation}</div>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <div className="text-[13px] text-[#666]">Fix Time</div>
              <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-[#202020]">
                {fixTime ? `${fixTime}s` : "Stable"}
              </div>
            </div>
            <div className="text-right text-[11px] text-[#7b7b7b]">AI analysis based on logs and traces.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
