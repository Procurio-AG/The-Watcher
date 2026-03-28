"use client";

import { useLogs } from "@/hooks/useLogs";

export default function RecentLogs() {
  const { data: logs } = useLogs(undefined, undefined, 4);

  return (
    <div className="glass-card flex min-h-[200px] flex-col p-5">
      <h3 className="mb-4 text-[16px] font-semibold text-[color:var(--text-primary)]">Recent Logs</h3>

      <div className="overflow-hidden rounded-[18px] border border-[color:var(--card-border)] bg-[color:var(--card-soft-bg)]">
        {(logs || []).slice(0, 4).map((log: any, index: number) => {
          const ts = log.timestamp
            ? new Date(Number(log.timestamp) / 1e6).toISOString().replace("T", " ").slice(11, 19)
            : "";

          return (
            <div
              key={`${log.timestamp}-${index}`}
              className="grid grid-cols-[92px_110px_minmax(0,1fr)_52px] items-center gap-3 border-b border-[color:var(--card-border)] px-4 py-3 text-[12px] last:border-b-0"
            >
              <span className="font-mono text-[color:var(--text-muted)]">{ts}</span>
              <span className="truncate font-semibold text-[color:var(--text-secondary)]">{log.service_name}</span>
              <span className="truncate text-[color:var(--text-secondary)]">{log.message}</span>
              <span className="text-right font-semibold uppercase text-[color:var(--text-muted)]">{String(log.level || "info").slice(0, 4)}</span>
            </div>
          );
        })}

        {(!logs || logs.length === 0) && (
          <div className="dashboard-empty-state h-[140px]">No recent logs are available.</div>
        )}
      </div>
    </div>
  );
}
