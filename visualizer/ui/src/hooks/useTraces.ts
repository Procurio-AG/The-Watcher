"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

export type TraceLookback = "1h" | "6h" | "24h";

export function useTraceServices() {
  return useSWR("/api/traces/services", (path: string) => apiFetch<string[]>(path), {
    refreshInterval: 30000,
  });
}

export function useTraces(service = "gateway-service", limit = 20, lookback: TraceLookback = "1h") {
  return useSWR(
    `/api/traces?service=${service}&limit=${limit}&lookback=${lookback}`,
    (path: string) => apiFetch<any[]>(path),
    { refreshInterval: 10000 }
  );
}

export function useTraceDetail(traceId: string | null) {
  return useSWR(
    traceId ? `/api/traces/${traceId}` : null,
    (path: string) => apiFetch<any>(path)
  );
}
