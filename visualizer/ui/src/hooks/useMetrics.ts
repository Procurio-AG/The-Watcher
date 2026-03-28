"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export type MetricsRange = "15m" | "1h" | "6h";

export interface OverviewData {
  system_state: string;
  error_rate: number;
  error_rate_delta?: number;
  latency_p95: number;
  latency_p95_delta?: number;
  rps: number;
  active_services: number;
}

export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface ServiceSeries {
  service: string;
  values: DataPoint[];
}

export interface LatencySeriesData {
  p50?: DataPoint[];
  p95?: DataPoint[];
  p99?: DataPoint[];
}

export function useOverview() {
  return useSWR<OverviewData>("/api/metrics/overview", fetcher, { refreshInterval: 5000 });
}

export function useLatencySeries(range: MetricsRange = "15m") {
  return useSWR<LatencySeriesData>(`/api/metrics/latency?range=${range}`, fetcher, { refreshInterval: 10000 });
}

export function useErrorSeries(range: MetricsRange = "15m") {
  return useSWR<ServiceSeries[]>(`/api/metrics/errors?range=${range}`, fetcher, { refreshInterval: 10000 });
}

export function useRequestSeries(range: MetricsRange = "15m") {
  return useSWR<ServiceSeries[]>(`/api/metrics/requests?range=${range}`, fetcher, { refreshInterval: 10000 });
}
