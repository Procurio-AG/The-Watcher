"use client";

import { useErrorSeries, type MetricsRange } from "@/hooks/useMetrics";

export default function ServiceErrors({ range }: { range: MetricsRange }) {
  const { data } = useErrorSeries(range);

  const latestByService = (data || [])
    .map((series: any) => ({
      service: series.service,
      value: series.values?.[series.values.length - 1]?.value || 0,
    }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 3);

  const total = latestByService.reduce((sum: number, item: any) => sum + item.value, 0);
  const maxValue = Math.max(...latestByService.map((item: any) => item.value), 1);
  const palette = [
    { track: "#fff0f2", bar: "progress-stripe-red" },
    { track: "#fff8e8", bar: "progress-stripe-blue" },
    { track: "#edf8ee", bar: "progress-stripe-green" },
  ];

  return (
    <div className="mock-panel card-hover flex h-full flex-col p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">
            Service Errors
          </h3>
          <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.05em] text-[#202022]">
            {Math.round(total * 100)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {latestByService.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-gray-400">No errors detected</p>
        ) : (
          latestByService.map((item: any, index: number) => (
            <div key={item.service}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#6d6962]">{item.service}</span>
                <span className="font-semibold text-[#5c5954]">+{item.value.toFixed(1)}%</span>
              </div>
              <div
                className="h-3 rounded-full"
                style={{ backgroundColor: palette[index % palette.length].track }}
              >
                <div
                  className={`h-full rounded-full ${palette[index % palette.length].bar}`}
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 18)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
