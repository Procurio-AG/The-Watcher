"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { MoreHorizontal } from "lucide-react";

const STRIPE_CLASSES = [
  "progress-stripe-red",
  "progress-stripe-green",
  "progress-stripe-blue",
  "progress-stripe-red",
  "progress-stripe-green",
];

const DOT_COLORS = ["#ef4444", "#22c55e", "#eab308", "#3b82f6", "#8b5cf6"];

export default function ServiceErrors() {
  const { data: services } = useSWR("/api/services", (p: string) => apiFetch<any[]>(p), {
    refreshInterval: 10000,
  });

  const errorServices = (services || [])
    .filter((s: any) => s.error_rate > 0)
    .sort((a: any, b: any) => b.error_rate - a.error_rate)
    .slice(0, 5);

  const totalErrors = errorServices.reduce((sum: number, s: any) => sum + s.error_rate, 0);

  return (
    <div className="bg-white rounded-3xl p-4 border border-surface-200 shadow-card card-hover h-full overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold text-gray-900">Retention</h3>
        <button className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Dot indicator */}
      {totalErrors > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-50 rounded-full border border-surface-200 mb-4">
          <span className="text-[12px] font-semibold text-gray-700">{totalErrors.toFixed(0)}%</span>
        </div>
      )}

      <div className="space-y-3">
        {errorServices.length === 0 && (
          <p className="text-[13px] text-gray-400 py-6 text-center">No errors detected</p>
        )}
        {errorServices.map((svc: any, i: number) => {
          const pct = totalErrors > 0 ? (svc.error_rate / totalErrors) * 100 : 0;
          return (
            <div key={svc.name} className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
              />
              <span className="text-[12px] text-gray-500 font-medium w-14">{pct.toFixed(0)}%</span>
              <div className="flex-1 h-2.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${STRIPE_CLASSES[i % STRIPE_CLASSES.length]}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-gray-400">
                +{svc.error_rate.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
