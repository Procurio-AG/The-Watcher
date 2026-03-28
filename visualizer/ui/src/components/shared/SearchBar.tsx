"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { askAI } from "@/hooks/useIncidents";

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({
  placeholder = "What do you want to know?",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await askAI(query);
      setResult(res.answer);
    } catch {
      setResult("Unable to analyze at this time. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[20px] border border-[#d8e6ff] bg-[linear-gradient(180deg,#eaf4ff_0%,#dceeff_62%,#ecf5ff_100%)] p-2 shadow-[0_14px_28px_rgba(129,167,219,0.16)]">
        <div className="flex h-[44px] items-center rounded-[14px] border border-white/70 bg-white/90 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder:text-[#b0aca5] focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-100"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#779ef7]" />
            ) : (
              <Search className="h-4 w-4 text-[#8f8a83]" />
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-[18px] border border-[#d8e3ff] bg-[#f6f9ff] px-4 py-3 shadow-[0_14px_26px_rgba(107,148,232,0.08)]">
          <p className="text-[12px] leading-6 text-slate-600">{result}</p>
        </div>
      )}
    </div>
  );
}
