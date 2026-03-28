"use client";

import { useLogs } from "@/hooks/useLogs";

export default function RecentLogs() {
  const { data: logs } = useLogs(undefined, undefined, 4);

  return (
    <div className="mock-panel card-hover flex h-full flex-col p-4">
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">
          Recent Logs
        </h3>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-surface-200 bg-[#fcfbf9]">
        {(logs || []).slice(0, 4).map((log: any, index: number) => {
          const ts = log.timestamp
            ? new Date(Number(log.timestamp) / 1e6).toISOString().replace("T", " ").slice(11, 19)
            : "";

          return (
            <div
              key={`${log.timestamp}-${index}`}
              className="grid grid-cols-[110px_1fr_52px] items-center gap-3 border-b border-surface-200 px-4 py-3 text-[12px] last:border-b-0"
            >
              <span className="font-mono text-[#9b968f]">{ts}</span>
              <span className="truncate">
                <span className="font-medium text-[#4a4742]">{log.service_name}</span>
                <span className="ml-3 text-[#8e8a84]">{log.message}</span>
              </span>
              <span className="text-right font-semibold uppercase text-[#65615a]">
                {String(log.level || "info").slice(0, 4)}
              </span>
            </div>
          );
        })}
        {(!logs || logs.length === 0) && (
          <p className="py-8 text-center text-[13px] text-gray-400">No logs available</p>
        )}
      </div>
    </div>
  );
}
