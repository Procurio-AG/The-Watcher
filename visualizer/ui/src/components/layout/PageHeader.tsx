"use client";

import { useState, type ElementType } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import type { MetricsRange } from "@/hooks/useMetrics";

interface PageHeaderProps {
  title: string;
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

const STATE_COLOR: Record<string, string> = {
  healthy: "text-[#57ba77]",
  degraded: "text-[#d8b542]",
  critical: "text-[#d46d74]",
};

export default function PageHeader({
  title,
  showControls = true,
  range = "15m",
  onRangeChange,
  systemState,
}: PageHeaderProps) {
  const [internalRange, setInternalRange] = useState<MetricsRange>(range);
  const selectedRange = onRangeChange ? range : internalRange;
  const Icon = systemState ? STATE_ICON[systemState] : null;
  const iconColor = systemState ? STATE_COLOR[systemState] : "";

  const handleRangeChange = (value: MetricsRange) => {
    if (onRangeChange) {
      onRangeChange(value);
      return;
    }
    setInternalRange(value);
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon ? <Icon className={`h-9 w-9 ${iconColor}`} /> : null}
        <h1 className="text-display text-[#202022]">{title}</h1>
      </div>

      {showControls ? (
        <div className="flex items-center gap-2.5">
          <label className="mock-pill flex h-11 items-center gap-2 px-4 text-[13px] text-slate-700">
            <select
              value={selectedRange}
              onChange={(event) => handleRangeChange(event.target.value as MetricsRange)}
              className="bg-transparent pr-4 outline-none"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-[#8d8881]" />
          </label>
        </div>
      ) : null}
    </div>
  );
}
