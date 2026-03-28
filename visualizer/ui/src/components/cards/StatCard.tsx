import { trendArrow } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  inverse?: boolean;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  inverse = true,
  subtitle,
}: StatCardProps) {
  const positiveIsBad = inverse && (delta || 0) > 0;
  const chipClass = positiveIsBad
    ? "status-chip-danger"
    : "status-chip-success";

  return (
    <div className="min-w-0 p-6">
      <p className="text-[13px] font-medium text-[color:var(--text-muted)]">{label}</p>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-[42px] font-bold tracking-[-0.06em] text-[color:var(--text-primary)]">{value}</span>
        {delta !== undefined && Math.abs(delta) > 0.001 ? (
          <span className={`mb-1 inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold ${chipClass}`}>
            {trendArrow(delta)} {deltaLabel || Math.abs(delta).toFixed(1)}
          </span>
        ) : null}
      </div>
      {subtitle ? <p className="mt-2 text-[12px] text-[color:var(--text-muted)]">{subtitle}</p> : null}
    </div>
  );
}
