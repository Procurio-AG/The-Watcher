"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";

export interface SimulationStatus {
  status: "idle" | "running" | "completed" | "failed";
  started_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
  last_message: string;
  logs: string[];
}

export function useSimulationStatus() {
  return useSWR<SimulationStatus>("/api/simulations", (path: string) => apiFetch<SimulationStatus>(path), {
    refreshInterval: 3000,
  });
}

export async function startAttackResolveSimulation() {
  return apiFetch<SimulationStatus>("/api/simulations/attack-resolve", {
    method: "POST",
  });
}
