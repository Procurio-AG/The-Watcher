"use client";

import { Sparkles } from "lucide-react";
import { useCurrentIncident } from "@/hooks/useIncidents";

const severityTone: Record<string, string> = {
  healthy: "status-chip-success",
  degraded: "status-chip-warning",
  critical: "status-chip-danger",
};

export default function AIIncidentPanel() {
  const { data } = useCurrentIncident();

  const severity = data?.severity || "healthy";
  const rootCause = data?.root_cause_service || "No critical service";
  const confidence = data?.confidence ?? 98;
  const impacts = data?.impact || ["System operating within normal parameters"];
  const remediation = data?.remediation || "No action needed";
  const fixTime = data?.fix_time_seconds;
  const uplift = Math.min(Math.max(confidence - 20, 45), 92);

  return (
    <div className="glass-card flex flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--control-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
          <Sparkles className="h-3.5 w-3.5" />
          Insights
        </span>
      </div>

      <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-[color:var(--text-primary)]">AI Incident Analysis</h3>

      <div className="insight-gradient mt-3 flex flex-1 rounded-[24px] p-[1px]">
        <div className="insight-overlay flex flex-1 flex-col rounded-[23px] border border-[color:var(--card-border)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] text-[color:var(--text-secondary)]">Projected Recovery Confidence</div>
              <div className="mt-2 text-[68px] font-semibold leading-none tracking-[-0.06em] text-[color:var(--text-inverse)]">{uplift}%</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${severityTone[severity] || severityTone.healthy}`}>
              {confidence}% confidence
            </span>
          </div>

          <div className="mt-4 rounded-[18px] border border-[color:var(--card-border)] bg-[color:var(--card-soft-bg)]/70 p-4 backdrop-blur-sm">
            <div className="text-[13px] font-semibold text-[color:var(--text-primary)]">Impact</div>
            <div className="mt-2 space-y-2">
              {impacts.map((item: string, index: number) => (
                <div key={`${item}-${index}`} className="flex items-center gap-3 text-[13px] text-[color:var(--text-secondary)]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--control-bg)] text-[12px] font-semibold text-[#df7b67]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[color:var(--card-border)] pt-4">
              <div className="text-[13px] font-semibold text-[color:var(--text-primary)]">Action</div>
              <div className="mt-2 text-[13px] text-[color:var(--text-secondary)]">{remediation}</div>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <div className="text-[13px] text-[color:var(--text-secondary)]">Root Cause Service</div>
              <div className="mt-1 text-[20px] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">
                {rootCause}
              </div>
            </div>
            <div className="text-right text-[11px] text-[color:var(--text-muted)]">
              {fixTime ? `Fix time ${fixTime}s` : "AI analysis based on logs and traces."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
