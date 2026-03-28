"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { useOverview } from "@/hooks/useMetrics";
import StatusBadge from "@/components/cards/StatusBadge";

const navItems = [
  { label: "System", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Incidents", href: "/incidents" },
  { label: "Logs", href: "/logs" },
  { label: "Traces", href: "/traces" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: overview } = useOverview();

  return (
    <header className="flex items-center justify-between gap-6 px-5 py-4 md:px-7 md:py-5">
      <Link href="/" className="flex min-w-[200px] items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#7201FF] shadow-[0_4px_16px_rgba(114,1,255,0.3)]">
          <Activity className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <div className="text-[17px] font-extrabold tracking-[-0.04em] text-[#1a1a1a]">The Watcher</div>
          <div className="text-[11px] font-medium tracking-[0.04em] text-[#999]">OBSERVABILITY CONSOLE</div>
        </div>
      </Link>

      <nav className="flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "glass-pill-active" : "glass-pill hover:bg-white/80"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-w-[240px] items-center justify-end gap-3">
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[#9a9a9a]">Active Services</div>
          <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-[#1f1f1f]">
            {overview?.active_services ?? 0}
          </div>
        </div>
        <StatusBadge status={overview?.system_state || "unknown"} size="md" />
      </div>
    </header>
  );
}
