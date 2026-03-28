"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { askAI } from "@/hooks/useIncidents";

export default function ExplorePanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const result = await askAI(question);
      setAnswer(result.answer);
    } catch {
      setAnswer("Unable to analyze at this time.");
    }
    setLoading(false);
  };

  return (
    <div className="mock-panel card-hover flex h-full flex-col p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">
          Explore Further
        </h3>
      </div>

      <div className="rounded-[18px] border border-surface-200 bg-white px-4 py-3 shadow-[0_10px_22px_rgba(115,106,89,0.06)]">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="What caused the latency spike at checkout?"
          className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-[#b0aca5] focus:outline-none"
        />
      </div>

      {answer ? (
        <div className="mt-3 rounded-[18px] border border-[#d8e3ff] bg-[#f6f9ff] px-4 py-3 text-[12px] leading-6 text-slate-600 shadow-[0_14px_26px_rgba(107,148,232,0.08)]">
          {answer}
        </div>
      ) : null}

      <div className="mt-auto flex justify-end pt-4">
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="flex items-center gap-2 rounded-[18px] bg-[#44578d] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_16px_30px_rgba(68,87,141,0.24)] transition hover:bg-[#3d4f80] disabled:cursor-not-allowed disabled:bg-[#9aa4bf]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Ask AI
        </button>
      </div>
    </div>
  );
}
