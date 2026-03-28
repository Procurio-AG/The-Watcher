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
    ? "bg-[rgba(239,68,68,0.12)] text-[#c95e66]"
    : "bg-[rgba(143,254,1,0.15)] text-[#3a7a00]";

  return (
    <div className="min-w-0 p-6">
      <p className="text-[13px] font-medium text-[#888]">{label}</p>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-[42px] font-bold tracking-[-0.06em] text-[#1a1a1a]">{value}</span>
        {delta !== undefined && Math.abs(delta) > 0.001 ? (
          <span className={`mb-1 inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold ${chipClass}`}>
            {trendArrow(delta)} {deltaLabel || Math.abs(delta).toFixed(1)}
          </span>
        ) : null}
      </div>
      {subtitle ? <p className="mt-2 text-[12px] text-[#aaa]">{subtitle}</p> : null}
    </div>
  );
}
