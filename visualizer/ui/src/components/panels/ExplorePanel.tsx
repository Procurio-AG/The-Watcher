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
    <div className="glass-card flex h-full flex-col p-5">
      <div>
        <h3 className="text-[15px] font-bold text-[#1a1a1a]">Explore Further</h3>
        <p className="mt-1 text-[12px] text-[#999]">Ask the backend incident analyzer a follow-up question</p>
      </div>

      <div className="mt-5">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleAsk();
            }
          }}
          placeholder="Ask about service health..."
          className="dashboard-input"
        />
      </div>

      {result ? (
        <div className="mt-4 flex-1 rounded-[18px] border border-[rgba(114,1,255,0.1)] bg-[rgba(114,1,255,0.03)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7201FF]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Response
          </div>
          <p className="text-[13px] leading-6 text-[#555]">{result}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 items-center rounded-[18px] border border-dashed border-white/30 px-5 text-[12px] text-[#aaa]">
          Ask about latency, error spikes, unhealthy services, or current incident severity.
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAsk}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[16px] bg-[#7201FF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(114,1,255,0.3)] transition hover:shadow-[0_12px_32px_rgba(114,1,255,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Ask AI
        </button>
      </div>
    </div>
  );
}
