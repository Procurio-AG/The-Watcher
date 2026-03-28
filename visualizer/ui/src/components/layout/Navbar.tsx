"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivitySquare } from "lucide-react";

const tabs = [
  { label: "System", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Logs", href: "/logs" },
  { label: "Traces", href: "/traces" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-[84px] items-center border-b border-surface-200 px-6">
      <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 shadow-[0_8px_18px_rgba(242,163,79,0.28)]">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-white/70 bg-white/20">
              <ActivitySquare className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.04em] text-slate-900">
            The Watcher
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-2xl px-4 py-2.5 text-[12px] font-medium tracking-[-0.02em] transition-all ${
                  isActive
                    ? "bg-[#2d2d30] text-white shadow-[0_10px_24px_rgba(35,35,38,0.22)]"
                    : "text-[#4e4d4a] hover:bg-[#f1efea]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
