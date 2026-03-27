"use client";
import { useState } from "react";
import { Search, Sparkles, ChevronUp, Loader2, X } from "lucide-react";
import { askAI } from "@/hooks/useIncidents";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await askAI(query);
      setResult(res.answer);
      setExpanded(true);
    } catch {
      setResult("Unable to analyze at this time. Please try again.");
      setExpanded(true);
    }
    setLoading(false);
  };

  const handleClear = () => {
    setResult(null);
    setExpanded(false);
    setQuery("");
  };

  return (
    <div className="relative">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-surface-200 shadow-card overflow-hidden">
        <div className="flex items-center px-5 py-3">
          <Sparkles className="w-4 h-4 text-amber-500 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="What would you like to explore next?"
            className="flex-1 text-[13px] text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none"
          />
          {result && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 hover:bg-surface-100 rounded-lg mr-1"
              >
                <ChevronUp
                  className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "" : "rotate-180"}`}
                />
              </button>
              <button
                onClick={handleClear}
                className="p-1 hover:bg-surface-100 rounded-lg mr-1"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </>
          )}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay result panel */}
      {result && expanded && (
        <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-white rounded-2xl border border-surface-200 shadow-card-hover p-4 max-h-[200px] overflow-y-auto">
          <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
