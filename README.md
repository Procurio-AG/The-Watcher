# SOLUTION: Autonomous Microservices Observability & Remediation

**"15 Seconds to Survival, Minutes to Cure."**

SOLUTION is an AI-driven observability pipeline designed for high-availability microservices. It solves the "Telemetry Overload" problem by separating instant infrastructure recovery from long-term code-level fixes.

## 🚀 The Core Value
- **Tier 1 (Edge):** Detects and remediates live failures in **<15 seconds** using WasmEdge and localized Loki streams.
- **Tier 2 (Central):** Conducts Deep Root Cause Analysis (RCA) using LangGraph and a custom NLP layer to open automated Pull Requests with code-level fixes.
- **Visualizer:** A real-time command center tracking every "band-aid" and "permanent cure" applied to the system.

## 🛠 Tech Stack
- **Apps:** FastAPI (Python), OpenTelemetry.
- **Infra:** Kubernetes (K3s), Pixie (eBPF), k6 (Load/Chaos).
- **Edge:** WasmEdge, Grafana Loki.
- **Brain:** LangGraph, FastAPI ML, Custom NLP Layer.
- **PR Automation:** PyGithub + LLM/NLP.

## 📂 Repository Structure
(See the structure section below for full details)

## ⚡ Quick Start
1. **Deploy Infra:** `make install-deps` (Installs K3s, Prometheus, Loki, Jaeger).
2. **Start Services:** `kubectl apply -f infrastructure/k8s/deployments/`.
3. **Run Attack:** `cd load-tests && k6 run scenarios/booking_flow.js`.
4. **Watch Remediation:** Access the Visualizer at `localhost:3000`.

## 🛡 License MIT