"use client";
import { useCurrentIncident } from "@/hooks/useIncidents";
import { Sparkles } from "lucide-react";

export default function AIIncidentPanel() {
  const { data } = useCurrentIncident();

  if (!data) {
    return (
      <div className="insight-gradient rounded-3xl p-5 h-full animate-pulse">
        <div className="h-4 bg-white/20 rounded w-1/2 mb-4" />
        <div className="h-12 bg-white/20 rounded w-1/3 mb-3" />
        <div className="h-4 bg-white/20 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="insight-gradient rounded-3xl p-5 text-white relative overflow-hidden h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
      <div className="relative flex-1 flex flex-col">
        {/* Badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Insights</span>
          </div>
        </div>

        {/* Confidence */}
        <p className="text-[42px] font-bold leading-none mb-3">{data.confidence}%</p>

        {/* Summary */}
        <p className="text-[14px] font-semibold leading-snug mb-1.5">
          {data.severity !== "healthy"
            ? `Error rate spike detected in ${data.root_cause_service}.`
            : "All services operating within normal parameters."}
        </p>
        <p className="text-[12px] text-white/80 leading-relaxed flex-1">
          {data.impact[0] || "System is healthy."}
          {data.fix_time_seconds
            ? ` Remediation completed in ${data.fix_time_seconds}s.`
            : ""}
        </p>

        {/* Progress indicator */}
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-1000"
            style={{ width: `${data.confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
