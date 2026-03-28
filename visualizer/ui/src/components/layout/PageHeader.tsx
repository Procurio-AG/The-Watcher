"use client";

import { useState, type ElementType } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import type { MetricsRange } from "@/hooks/useMetrics";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showControls?: boolean;
  range?: MetricsRange;
  onRangeChange?: (range: MetricsRange) => void;
  systemState?: string;
}

const RANGE_OPTIONS: Array<{ value: MetricsRange; label: string }> = [
  { value: "15m", label: "Daily" },
  { value: "1h", label: "Weekly" },
  { value: "6h", label: "Monthly" },
];

const STATE_ICON: Record<string, ElementType> = {
  healthy: CheckCircle2,
  degraded: AlertCircle,
  critical: AlertTriangle,
};

const STATE_ICON_COLOR: Record<string, string> = {
  healthy: "text-[#26b04d]",
  degraded: "text-[#dd9b2a]",
  critical: "text-[#dc4d5d]",
};

export default function PageHeader({
  title,
  subtitle,
  showControls = true,
  range = "15m",
  onRangeChange,
  systemState,
}: PageHeaderProps) {
  const [internalRange, setInternalRange] = useState<MetricsRange>(range);
  const selectedRange = onRangeChange ? range : internalRange;
  const Icon = systemState ? STATE_ICON[systemState] : null;

  const handleRangeChange = (value: MetricsRange) => {
    if (onRangeChange) {
      onRangeChange(value);
      return;
    }
    setInternalRange(value);
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-5 pt-1 section-fade">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon ? <Icon className={`h-7 w-7 ${STATE_ICON_COLOR[systemState || "healthy"]}`} strokeWidth={2} /> : null}
          <h1 className="section-title">{title}</h1>
        </div>
        {subtitle ? <p className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>{subtitle}</p> : null}
      </div>

      {showControls ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-[14px] border px-4 py-2 text-[13px] font-medium" style={{ borderColor: "var(--card-border)", background: "var(--control-bg)", color: "var(--text-secondary)" }}>
            Jan 01 - Jul 31
          </span>
          <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>compared to</span>
          <span className="rounded-[14px] border px-4 py-2 text-[13px] font-medium" style={{ borderColor: "var(--card-border)", background: "var(--control-bg)", color: "var(--text-secondary)" }}>
            Aug 01 - Dec 31
          </span>

          <label className="dashboard-select inline-flex items-center gap-2 pr-3">
            <select
              value={selectedRange}
              onChange={(e) => handleRangeChange(e.target.value as MetricsRange)}
              className="bg-transparent pr-2 text-[13px] font-semibold text-[color:var(--text-primary)] outline-none"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </label>
        </div>
      ) : null}
    </div>
  );
}
