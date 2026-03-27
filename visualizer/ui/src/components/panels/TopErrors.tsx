"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import StatusBadge from "@/components/cards/StatusBadge";
import { MoreHorizontal } from "lucide-react";

// Dot matrix visualization
function DotMatrix({ value, max, color }: { value: number; max: number; color: string }) {
  const total = 28; // 7x4 grid
  const filled = Math.round((value / Math.max(max, 1)) * total);

  return (
    <div className="flex flex-wrap gap-[3px] w-[60px]">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="w-[5px] h-[5px] rounded-full transition-colors"
          style={{
            backgroundColor: i < filled ? color : "#e7e5e4",
          }}
        />
      ))}
    </div>
  );
}

export default function TopErrors() {
  const { data: services } = useSWR("/api/services", (p: string) => apiFetch<any[]>(p), {
    refreshInterval: 10000,
  });

  const sortedServices = (services || [])
    .sort((a: any, b: any) => b.error_rate - a.error_rate)
    .slice(0, 2);

  return (
    <div className="bg-white rounded-3xl p-4 border border-surface-200 shadow-card card-hover h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-gray-900">Transactions</h3>
        <button className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-5">
        {sortedServices.map((svc: any, i: number) => {
          const color = i === 0 ? "#22c55e" : "#3b82f6";
          return (
            <div key={svc.name}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-stat-sm text-gray-900">
                      {svc.rps > 0 ? Math.round(svc.rps * 1000) : 0}
                    </span>
                    <div className="px-2 py-0.5 bg-surface-50 rounded-full border border-surface-200">
                      <span className="text-[11px] font-medium text-gray-500">
                        Peak: <span className="font-semibold text-gray-700">Now</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-400">{svc.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <DotMatrix value={svc.rps * 100} max={100} color={color} />
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400">vs last period</p>
                    <p className="text-[13px] font-semibold text-gray-700">
                      +{(svc.rps * 100).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sortedServices.length === 0 && (
          <p className="text-[13px] text-gray-400 py-6 text-center">No data available</p>
        )}
      </div>
    </div>
  );
}
