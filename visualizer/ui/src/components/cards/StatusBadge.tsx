interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusStyles: Record<string, { wrap: string; dot: string }> = {
  healthy: { wrap: "bg-[rgba(143,254,1,0.12)] text-[#3a7a00] border-[rgba(143,254,1,0.25)]", dot: "bg-[#8FFE01]" },
  degraded: { wrap: "bg-[rgba(245,158,11,0.12)] text-[#ae7a11] border-[rgba(245,158,11,0.25)]", dot: "bg-[#f59e0b]" },
  critical: { wrap: "bg-[rgba(239,68,68,0.12)] text-[#bb4f58] border-[rgba(239,68,68,0.25)]", dot: "bg-[#ef4444]" },
  down: { wrap: "bg-white/30 text-[#737373] border-white/30", dot: "bg-[#8a8a8a]" },
  unknown: { wrap: "bg-white/30 text-[#737373] border-white/30", dot: "bg-[#8a8a8a]" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.unknown;
  const sizeClass = size === "md" ? "px-3 py-1.5 text-[11px]" : "px-2.5 py-1 text-[10px]";
  const isPulsing = status !== "healthy" && status !== "unknown";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-bold capitalize backdrop-blur-sm ${style.wrap} ${sizeClass}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot} ${isPulsing ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}
