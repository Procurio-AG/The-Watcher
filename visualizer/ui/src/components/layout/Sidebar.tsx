"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "System", href: "/" },
  { label: "Services", href: "/services" },
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
        <span className="text-[16px] font-extrabold tracking-[-0.03em] text-[#242424]">The Watcher</span>
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

      <div className="flex items-center justify-end" />
    </header>
  );
}
