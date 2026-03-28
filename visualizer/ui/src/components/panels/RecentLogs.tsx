"use client";

import { useLogs } from "@/hooks/useLogs";

export default function RecentLogs() {
  const { data: logs } = useLogs(undefined, undefined, 4);

  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-[#1a1a1a]">Recent Logs</h3>
        <p className="mt-1 text-[12px] text-[#999]">Latest backend log lines across services</p>
      </div>

      <div className="rounded-[18px] border border-white/40 bg-white/40 overflow-hidden backdrop-blur-sm">
        {(logs || []).slice(0, 4).map((log: any, index: number) => {
          const ts = log.timestamp
            ? new Date(Number(log.timestamp) / 1e6).toISOString().replace("T", " ").slice(11, 19)
            : "";

          return (
            <div
              key={`${log.timestamp}-${index}`}
              className="grid grid-cols-[86px_110px_minmax(0,1fr)_54px] items-center gap-3 border-b border-white/30 px-4 py-3 text-[12px] last:border-b-0"
            >
              <span className="font-mono text-[#aaa]">{ts}</span>
              <span className="truncate font-semibold text-[#555]">{log.service_name}</span>
              <span className="truncate text-[#888]">{log.message}</span>
              <span className="text-right font-bold uppercase text-[#999]">{String(log.level || "info").slice(0, 4)}</span>
            </div>
          );
        })}

        {(!logs || logs.length === 0) && (
          <div className="flex h-[140px] items-center justify-center text-[13px] text-[#999]">No logs available</div>
        )}
      </div>
    </div>
  );
}
