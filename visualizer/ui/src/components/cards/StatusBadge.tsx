interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusStyles: Record<string, { wrap: string; dot: string }> = {
  healthy: { wrap: "status-chip-success border-transparent", dot: "bg-[#26b04d]" },
  degraded: { wrap: "status-chip-warning border-transparent", dot: "bg-[#dd9b2a]" },
  critical: { wrap: "status-chip-danger border-transparent", dot: "bg-[#dc4d5d]" },
  down: { wrap: "bg-[color:var(--control-bg)] text-[color:var(--text-secondary)] border-[color:var(--card-border)]", dot: "bg-[#8a8a8a]" },
  unknown: { wrap: "bg-[color:var(--control-bg)] text-[color:var(--text-secondary)] border-[color:var(--card-border)]", dot: "bg-[#8a8a8a]" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.unknown;
  const sizeClass = size === "md" ? "px-3 py-1.5 text-[11px]" : "px-2.5 py-1 text-[10px]";
  const isPulsing = status === "critical";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-semibold capitalize ${style.wrap} ${sizeClass}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot} ${isPulsing ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}
