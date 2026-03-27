"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Search, Bell, User } from "lucide-react";

const tabs = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Logs", href: "/logs" },
  { label: "Traces", href: "/traces" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-surface-200 sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between h-[64px]">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[17px] text-gray-900 tracking-tight">The Watcher</span>
          </Link>

          <div className="flex items-center gap-0.5">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-[7px] rounded-full text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-gray-900 text-white shadow-pill"
                      : "text-gray-500 hover:text-gray-900 hover:bg-surface-100"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center hover:bg-surface-100 rounded-full transition-colors">
            <Search className="w-[18px] h-[18px] text-gray-500" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center hover:bg-surface-100 rounded-full transition-colors relative">
            <Bell className="w-[18px] h-[18px] text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 ring-2 ring-white shadow-sm cursor-pointer overflow-hidden flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </nav>
  );
}
