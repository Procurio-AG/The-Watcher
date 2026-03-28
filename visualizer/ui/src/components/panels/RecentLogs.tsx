"use client";

import { useLogs } from "@/hooks/useLogs";

export default function RecentLogs() {
  const { data: logs } = useLogs(undefined, undefined, 4);

  return (
    <div className="glass-card flex min-h-[200px] flex-col p-5">
      <h3 className="mb-4 text-[15px] font-semibold text-[#2c2c2c]">Recent Logs</h3>

      <div className="overflow-hidden rounded-[18px] border border-[#efebe5] bg-white/70">
        {(logs || []).slice(0, 4).map((log: any, index: number) => {
          const ts = log.timestamp
            ? new Date(Number(log.timestamp) / 1e6).toISOString().replace("T", " ").slice(11, 19)
            : "";

          return (
            <div
              key={`${log.timestamp}-${index}`}
              className="grid grid-cols-[92px_110px_minmax(0,1fr)_52px] items-center gap-3 border-b border-[#f1eeea] px-4 py-3 text-[12px] last:border-b-0"
            >
              <span className="font-mono text-[#a2a2a2]">{ts}</span>
              <span className="truncate font-semibold text-[#5f5f5f]">{log.service_name}</span>
              <span className="truncate text-[#7c7c7c]">{log.message}</span>
              <span className="text-right font-semibold uppercase text-[#9a9a9a]">{String(log.level || "info").slice(0, 4)}</span>
            </div>
          );
        })}

        {(!logs || logs.length === 0) && (
          <div className="flex h-[140px] items-center justify-center text-[13px] text-[#9a9a9a]">No logs available</div>
        )}
      </div>
    </div>
  );
}
