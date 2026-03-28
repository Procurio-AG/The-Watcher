"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { askAI } from "@/hooks/useIncidents";

export default function ExplorePanel() {
  const [query, setQuery] = useState("What caused the latency spike at checkout?");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const response = await askAI(query);
      setResult(response.answer);
    } catch {
      setResult("Unable to analyze the system right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card flex flex-col p-5">
      <h3 className="text-[15px] font-semibold text-[#2d2d2d]">Explore Further</h3>

      <div className="mt-5">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAsk();
          }}
          placeholder="Ask about service health..."
          className="dashboard-input"
        />
      </div>

      {result ? (
        <div className="dashboard-card-subtle mt-4 flex-1 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#556eb5]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Response
          </div>
          <p className="text-[13px] leading-6 text-[#565656]">{result}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 items-center rounded-[20px] border border-dashed border-[#ece7df] px-5 text-[12px] text-[#a0a0a0]">
          Ask about latency, error spikes, unhealthy services, or current incident severity.
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAsk}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[18px] bg-[linear-gradient(180deg,#526dac_0%,#415a99_100%)] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_12px_24px_rgba(77,102,171,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Ask AI
        </button>
      </div>
    </div>
  );
}
