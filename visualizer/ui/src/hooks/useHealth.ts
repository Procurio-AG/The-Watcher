"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";

export interface HealthStatus {
  status: string;
  dependencies?: {
    prometheus?: { status: string; url?: string | null };
    loki?: { status: string; url?: string | null };
    jaeger?: { status: string; url?: string | null };
  };
}

export function useHealth() {
  return useSWR<HealthStatus>("/api/health", (path: string) => apiFetch<HealthStatus>(path), {
    refreshInterval: 5000,
  });
}
