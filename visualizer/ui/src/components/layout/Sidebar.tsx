"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Logs", href: "/logs" },
  { label: "Traces", href: "/traces" },
  { label: "Intelligence", href: "/intelligence" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 md:px-8 md:py-5" style={{ borderColor: "var(--card-border)" }}>
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] border shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--control-bg)" }}>
          <div className="h-3.5 w-3.5 rounded-[4px] border-2" style={{ borderColor: "var(--accent)" }} />
        </div>
        <span className="text-[26px] font-semibold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>
          The Watcher
        </span>
      </Link>

      <nav className="flex max-w-full flex-wrap items-center gap-1 rounded-[18px] border px-1.5 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.04)]" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex items-center rounded-[12px] px-4 py-2 text-[12px] font-semibold shadow-sm"
                  : "inline-flex items-center rounded-[12px] px-4 py-2 text-[12px] font-medium hover:bg-[color:var(--control-bg-hover)]"
              }
              style={isActive ? { background: "var(--accent)", color: "var(--shell-bg)" } : { color: "var(--text-secondary)" }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-11 w-11 rounded-full border" style={{ borderColor: "var(--card-border)", background: "var(--control-bg)" }} />
      </div>
    </header>
  );
}
