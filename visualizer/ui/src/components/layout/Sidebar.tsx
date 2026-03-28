"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";

const navItems = [
  { label: "System", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Incidents", href: "/incidents" },
  { label: "Logs", href: "/logs" },
  { label: "Traces", href: "/traces" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-5">
      <Link href="/" className="flex min-w-[180px] items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#efcea1] bg-[#f4a531] shadow-sm">
          <div className="h-4 w-4 rounded-[4px] border-2 border-white" />
        </div>
        <span className="text-[16px] font-extrabold tracking-[-0.03em] text-[#242424]">zentra</span>
      </Link>

      <nav className="flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={isActive ? "glass-pill-active" : "glass-pill"}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-w-[300px] items-center justify-end gap-3">
        <div className="glass-pill">
          <span>Production</span>
          <ChevronDown className="h-4 w-4 text-[#9a9a9a]" />
        </div>
        <div className="glass-pill">
          <span>Last 15 min</span>
          <ChevronDown className="h-4 w-4 text-[#9a9a9a]" />
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ece6df] bg-white text-[#777] shadow-sm">
          <Search className="h-4 w-4" />
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ecd9cb] bg-[linear-gradient(180deg,#fff1e4_0%,#ffd8b8_100%)] text-[13px] font-bold text-[#9c5f36] shadow-sm">
          B
        </div>
      </div>
    </header>
  );
}
