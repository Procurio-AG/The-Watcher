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
  { value: "15m", label: "Last 15 min" },
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
];

const STATE_ICON: Record<string, ElementType> = {
  healthy: CheckCircle2,
  degraded: AlertCircle,
  critical: AlertTriangle,
};

const STATE_ICON_COLOR: Record<string, string> = {
  healthy: "text-[#8FFE01]",
  degraded: "text-[#f59e0b]",
  critical: "text-[#ef4444]",
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
    <div className="flex items-start justify-between gap-4 pb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon ? <Icon className={`h-7 w-7 ${STATE_ICON_COLOR[systemState || "healthy"]}`} strokeWidth={2} /> : null}
          <h1 className="text-[30px] font-bold tracking-[-0.05em] text-[#1a1a1a]">{title}</h1>
        </div>
        {subtitle ? <p className="mt-1.5 text-[13px] text-[#999]">{subtitle}</p> : null}
      </div>

      {showControls ? (
        <label className="glass-pill shrink-0 pr-3">
          <span className="text-[#999]">Range</span>
          <select
            value={selectedRange}
            onChange={(e) => handleRangeChange(e.target.value as MetricsRange)}
            className="bg-transparent px-1 py-0 pr-5 text-[13px] font-bold text-[#333] outline-none"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-[#999]" />
        </label>
      ) : null}
    </div>
  );
}
