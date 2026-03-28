# SOLUTION — Setup & Run Guide

> **One-liner:** An AI-driven observability platform that detects anomalies in microservices using an ONNX ML model and auto-remediates via KEDA-powered autoscaling in under 15 seconds.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Two Ways to Run](#two-ways-to-run)
4. [Option A: Docker Compose (Observe-Only)](#option-a-docker-compose-observe-only)
5. [Option B: Kubernetes + KEDA (Full Loop)](#option-b-kubernetes--keda-full-loop)
6. [Verify Everything Is Running](#verify-everything-is-running)
7. [Running Chaos Attacks](#running-chaos-attacks)
8. [Accessing Dashboards](#accessing-dashboards)
9. [Component Reference](#component-reference)
10. [Environment Variables](#environment-variables)
11. [Troubleshooting](#troubleshooting)
12. [Teardown](#teardown)

---

## Prerequisites

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| Docker | 20+ | `docker --version` | [docs.docker.com](https://docs.docker.com/get-docker/) |
| kubectl | 1.28+ | `kubectl version --client` | `snap install kubectl --classic` |
| minikube | 1.30+ | `minikube version` | `snap install minikube` |
| Helm | 3.x | `helm version` | `snap install helm --classic` |
| k6 | latest | `k6 version` | `snap install k6` |
| Node.js | 20+ | `node --version` | (only for local edge-remedy dev) |

---

## Architecture Overview

```
                         k6 Load Tests / Chaos Attacks
                                    |
                                    v
                      +------- Gateway (NodePort :30080) -------+
                      |                                          |
          +-----------+-----------+              +---------------+
          |           |           |              |               |
       user-svc   auth-svc   station-svc   train-svc   schedule-svc
                                              ticket-svc   order-svc
                                              payment-svc  notification-svc
                      |
          +-----------+-----------+
          |           |           |
       Prometheus   Jaeger     Loki          <-- Observability Stack
          |
          v
    PushGateway  <----  Edge-Remedy (ONNX anomaly detection, per-service)
          |
          v
       KEDA ScaledObjects  -->  HPA  -->  Auto-scale pods
```

**The Loop:** Services emit metrics/traces/logs --> Prometheus/Jaeger/Loki collect --> Edge-remedy polls every 2s --> ONNX model scores anomaly (0-1) --> Score pushed to PushGateway --> KEDA reads score --> Scales pods up/down --> Edge-remedy can also restart pods directly.

---

## Two Ways to Run

| | Docker Compose | Kubernetes + KEDA |
|---|---|---|
| **Best for** | Quick demo, UI development | Full end-to-end testing |
| **Autoscaling** | No | Yes (KEDA ML-driven) |
| **Remediation** | Disabled | Enabled (restart + scale) |
| **Edge-remedy instances** | 1 (payment only) | 4 (payment, ticket, order, gateway) |
| **Circuit breaker** | No | Yes |
| **Predictive scaling** | Detects but can't act | Full Holt-Winters forecasting |
| **Health probes** | None | Liveness + Readiness every 2-3s |
| **Resource limits** | Unlimited | CPU/memory capped per pod |
| **WasmEdge DaemonSet** | No | Yes (runs on every node) |

---

## Option A: Docker Compose (Observe-Only)

Fastest way to get the system up. Good for UI dev and basic anomaly detection demos.

```bash
# Start everything (18 containers)
cd services/irctc
docker-compose up --build -d

# Check status
docker-compose ps

# View edge-remedy logs (ONNX model output)
docker-compose logs -f edge-remedy

# Stop
docker-compose down
```

**Ports:**

| Service | URL |
|---------|-----|
| Gateway API | http://localhost:8000 |
| Visualizer UI | http://loca
lhost:3001 |
| Visualizer API | http://localhost:8081 |
| Jaeger UI | http://localhost:16686 |
| Prometheus | http://localhost:9090 |
| Loki | http://localhost:3100 |
| PushGateway | http://localhost:9091 |

> **Note:** Set `GEMINI_API_KEY` in your environment for AI root cause analysis: `export GEMINI_API_KEY=your_key`

---

## Option B: Kubernetes + KEDA (Full Loop)

This is the production-like setup where everything works end-to-end.

### Step 1: Start minikube

```bash
# Start cluster (adjust memory to your system, minimum 4096)
minikube start --cpus=4 --memory=6144
```

### Step 2: Build images inside minikube's Docker

```bash
# Point docker CLI to minikube's Docker daemon
eval $(minikube docker-env)

# Build all 10 microservices
cd services/irctc/services
for svc in user-service auth-service station-service train-service schedule-service ticket-service order-service payment-service notification-service gateway-service; do
  docker build --build-arg SERVICE_NAME=$svc -t irctc-$svc:latest .
done

# Build edge-remedy
cd ../../../edge-remedy
docker build -t edge-remedy:latest .
```

### Step 3: Install KEDA

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace
```

Wait for KEDA pods to be ready:

```bash
kubectl get pods -n keda --watch
# All 3 pods should show Running (1-2 minutes)
```

### Step 4: Deploy everything

```bash
# Create namespace
kubectl create namespace train-ticket

# Create SLA thresholds ConfigMap (needed by WasmEdge DaemonSet)
kubectl create configmap wasm-sla-thresholds -n train-ticket \
  --from-literal=sla_config.json='{"p95_latency_ms":2000,"error_rate_percent":5,"detection_window_seconds":15,"cpu_threshold_percent":80}'

# Deploy in order: configs first, then services, then edge + KEDA
kubectl apply -f services/irctc/k8s/monitoring-configmaps.yaml
kubectl apply -f services/irctc/k8s/services-deployment.yaml
kubectl apply -f services/irctc/k8s/wasmedge-daemonset.yaml
kubectl apply -f services/irctc/k8s/edge-remedy-deployment.yaml
kubectl apply -f services/irctc/k8s/keda-scaledobjects.yaml
```

### Step 5: Verify

```bash
# All pods should be Running (23 total)
kubectl get pods -n train-ticket

# KEDA ScaledObjects should show READY=True, ACTIVE=True
kubectl get scaledobjects -n train-ticket

# HPAs created by KEDA
kubectl get hpa -n train-ticket
```

### Step 6: Access the gateway

The gateway is exposed via NodePort 30080. Use port-forward for reliable access:

```bash
# Port-forward gateway to localhost:8000
kubectl port-forward svc/gateway-service 8000:8000 -n train-ticket &

# Test it
curl http://localhost:8000/healthz
# Expected: {"status":"ok"}
```

Port-forward other services as needed:

```bash
# Jaeger UI
kubectl port-forward svc/jaeger-service 16686:16686 -n train-ticket &

# Prometheus
kubectl port-forward svc/prometheus-service 9090:9090 -n train-ticket &

# PushGateway (view ML anomaly scores)
kubectl port-forward svc/pushgateway-service 9091:9091 -n train-ticket &
```

---

## Verify Everything Is Running

### Quick health check (all components)

```bash
# 1. Gateway responds
curl -s http://localhost:8000/healthz
# {"status":"ok"}

# 2. All services reachable through gateway
curl -s http://localhost:8000/users | head -c 200
curl -s http://localhost:8000/stations | head -c 200
curl -s http://localhost:8000/trains | head -c 200

# 3. ONNX model running (check edge-remedy logs)
kubectl logs deployment/edge-remedy-payment -n train-ticket --tail=10
# Should show: [WASM RESULT] Logits: [...], [SOFTMAX] Anomaly Score: X.XX

# 4. KEDA autoscaling active
kubectl get scaledobjects -n train-ticket
# READY=True, ACTIVE=True for all 4

# 5. Prometheus scraping
curl -s http://localhost:9090/api/v1/targets | python3 -m json.tool | grep -c '"health":"up"'
# Should show 11 (10 services + pushgateway)

# 6. Anomaly scores in PushGateway
curl -s http://localhost:9091/metrics | grep watcher_anomaly_score
# Should show scores per service
```

### Pod count summary (K8s)

| Component | Expected Pods | Notes |
|-----------|--------------|-------|
| Microservices (10) | 10-14 | Some scaled to 2 by KEDA fallback |
| Edge-remedy | 4 | One per monitored service |
| WasmEdge DaemonSet | 1 | One per node (1 node in minikube) |
| Jaeger | 1 | |
| Prometheus | 1 | |
| Loki | 1 | |
| PushGateway | 1 | |
| **Total** | **~23** | |

---

## Running Chaos Attacks

### Option 1: k6 load tests (external)

```bash
# Set the target URL
export K6_BASE_URL=http://localhost:8000

# Baseline traffic (normal user journey)
k6 run load-tests/scenarios/booking_flow.js

# Attack: Latency injection (10s sleep on payment service)
k6 run load-tests/attacks/latency.js

# Attack: Error spike (HTTP 500s on notification service)
k6 run load-tests/attacks/error_spike.js

# Attack: CPU starvation (2s burn loop)
k6 run load-tests/attacks/cpu_starvation.js

# Run all attacks in sequence
cd load-tests && ./run_all.sh
```

### Option 2: Manual curl attacks

```bash
# Inject latency (10s sleep) into payment service
curl -H "x-chaos-trigger: latency" http://localhost:8000/payments

# Inject HTTP 500 error into notification service
curl -H "x-chaos-trigger: error" http://localhost:8000/notify

# Inject CPU burn into any service
curl -H "x-chaos-trigger: cpu" http://localhost:8000/users
```

### Option 3: Visualizer simulation (UI-driven)

```bash
# Start the attack simulation via API
curl -X POST http://localhost:8081/api/simulations/attack-resolve

# Check simulation status
curl http://localhost:8081/api/simulations
```

### What to watch during attacks

```bash
# Terminal 1: Edge-remedy detecting anomalies
kubectl logs -f deployment/edge-remedy-payment -n train-ticket

# Terminal 2: KEDA scaling pods
kubectl get pods -n train-ticket --watch

# Terminal 3: HPA scaling decisions
kubectl get hpa -n train-ticket --watch

# Terminal 4: Prometheus anomaly scores
watch -n2 'curl -s http://localhost:9091/metrics | grep watcher_anomaly_score'
```

**Expected flow during attack:**
1. k6 sends chaos header --> ChaosMiddleware injects failure
2. Prometheus scrapes spike in latency/errors (within 5s)
3. Edge-remedy detects anomaly via ONNX model (within 2s poll)
4. Anomaly score pushed to PushGateway (e.g., 0.75)
5. KEDA reads score > 0.25 threshold --> triggers HPA scale-up
6. Edge-remedy restarts affected deployment (if REMEDIATION_ENABLED=true)
7. New pods come online, traffic redistributes, metrics normalize

---

## Accessing Dashboards

### Kubernetes (port-forward)

```bash
# Run all port-forwards in background
kubectl port-forward svc/gateway-service 8000:8000 -n train-ticket &
kubectl port-forward svc/jaeger-service 16686:16686 -n train-ticket &
kubectl port-forward svc/prometheus-service 9090:9090 -n train-ticket &
kubectl port-forward svc/pushgateway-service 9091:9091 -n train-ticket &
kubectl port-forward svc/loki-service 3100:3100 -n train-ticket &
```

| Dashboard | URL | What to look for |
|-----------|-----|------------------|
| Jaeger | http://localhost:16686 | Trace spans, service dependencies, latency breakdown |
| Prometheus | http://localhost:9090 | Query `watcher_anomaly_score`, `http_request_duration_seconds` |
| PushGateway | http://localhost:9091 | ML anomaly scores per service |

### Useful Prometheus Queries

```promql
# Anomaly scores per service (from ONNX model)
watcher_anomaly_score

# Request rate per service
sum(rate(http_request_duration_seconds_count[2m])) by (job)

# P95 latency per service
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[2m])) by (le, job))

# Error rate (5xx)
sum(rate(http_requests_total{status=~"5.."}[2m])) by (job)
```

---

## Component Reference

### Microservices

| Service | Internal Port | K8s Service | Description |
|---------|--------------|-------------|-------------|
| gateway-service | 8000 | NodePort :30080 | API router, proxies to all backends |
| user-service | 8000 | ClusterIP | User CRUD |
| auth-service | 8000 | ClusterIP | JWT authentication |
| station-service | 8000 | ClusterIP | Train station data |
| train-service | 8000 | ClusterIP | Train information |
| schedule-service | 8000 | ClusterIP | Train schedules |
| ticket-service | 8000 | ClusterIP | Ticket management |
| order-service | 8000 | ClusterIP | Booking orders |
| payment-service | 8000 | ClusterIP | Payment processing |
| notification-service | 8000 | ClusterIP | Notifications |

### Edge-Remedy Instances (K8s only)

| Instance | Target | Monitors |
|----------|--------|----------|
| edge-remedy-payment | payment-service | Anomaly detection + remediation |
| edge-remedy-ticket | ticket-service | Anomaly detection + remediation |
| edge-remedy-order | order-service | Anomaly detection + remediation |
| edge-remedy-gateway | gateway-service | Anomaly detection + remediation |

### KEDA ScaledObjects

| Service | Min | Max | Triggers |
|---------|-----|-----|----------|
| payment-service | 1 | 5 | ML anomaly score, RPS, P95 latency, error rate |
| ticket-service | 1 | 5 | ML anomaly score, RPS, P95 latency |
| order-service | 1 | 5 | ML anomaly score, RPS, P95 latency, error rate |
| gateway-service | 1 | 4 | ML anomaly score, RPS |

### ML Model (ONNX)

- **File:** `edge-remedy/src/green_leaf_v1.onnx`
- **Inputs:** Tokenized log line (int64[1,10]), normalized CPU + latency (float32[1,2]), trace duration (float32[1,1])
- **Output:** 3-class logits [healthy, anomaly, severe] --> softmax with configurable temperature
- **Anomaly score:** `1 - P(healthy)` — pushed to PushGateway as `watcher_anomaly_score`

### Predictive Forecaster (Holt-Winters)

- **Algorithm:** Triple exponential smoothing
- **Data source:** Prometheus historical CPU + RPS (24h window, 5min resolution)
- **Forecast horizon:** 10 minutes ahead
- **Triggers proactive scaling when:** CPU forecast > 70% OR RPS spike > 2x current average

---

## Environment Variables

### Edge-Remedy

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_SERVICE` | payment-service | Which service to monitor |
| `PROMETHEUS_URL` | http://prometheus-service:9090 | Metrics endpoint |
| `LOKI_URL` | http://loki-service:3100 | Logs endpoint |
| `JAEGER_URL` | http://jaeger-service:16686 | Traces endpoint |
| `PUSHGATEWAY_URL` | http://pushgateway-service:9091 | Where to push anomaly scores |
| `REMEDIATION_ENABLED` | true (K8s) / false (compose) | Toggle auto-restart |
| `CIRCUIT_BREAKER_ENABLED` | true (K8s) / false (compose) | Fallback scaling when PushGateway down |
| `PREDICTIVE_SCALING_ENABLED` | true | Toggle Holt-Winters forecasting |
| `SOFTMAX_TEMPERATURE` | 1.5 | ONNX softmax temperature (>1 = less confident) |

### Visualizer API

| Variable | Default | Description |
|----------|---------|-------------|
| `PROMETHEUS_URL` | http://prometheus:9090 | Metrics source |
| `LOKI_URL` | http://loki:3100 | Logs source |
| `JAEGER_URL` | http://jaeger:16686 | Traces source |
| `GEMINI_API_KEY` | (none) | Google Gemini for AI root cause analysis |
| `GATEWAY_URL` | http://gateway-service:8000 | Gateway for attack simulations |

### Chaos Engineering

| Variable | Default | Description |
|----------|---------|-------------|
| `CHAOS_LATENCY_MAX_MS` | 0 | Max injected latency (0 = disabled) |
| `CHAOS_ERROR_RATE` | 0.0 | Random error injection rate (0-1) |

Chaos can also be triggered per-request via HTTP headers:
- `x-chaos-trigger: latency` — 10s blocking sleep
- `x-chaos-trigger: error` — immediate HTTP 500
- `x-chaos-trigger: cpu` — 2s CPU burn loop

---

## Troubleshooting

### Pod stuck in CrashLoopBackOff

```bash
# Check logs
kubectl logs <pod-name> -n train-ticket --previous

# Common cause: services starting before dependencies
# Fix: wait and let K8s restart — liveness probes will stabilize
```

### WasmEdge DaemonSet stuck in ContainerCreating

```bash
# Likely missing ConfigMap
kubectl create configmap wasm-sla-thresholds -n train-ticket \
  --from-literal=sla_config.json='{"p95_latency_ms":2000,"error_rate_percent":5,"detection_window_seconds":15,"cpu_threshold_percent":80}'

# Then delete the stuck pod (DaemonSet will recreate it)
kubectl delete pod -l app=wasmedge-agent -n train-ticket
```

### KEDA ScaledObjects show FALLBACK=True

```bash
# This means Prometheus queries are failing. Check:
kubectl logs deployment/keda-operator -n keda --tail=20

# Verify Prometheus is scraping
kubectl port-forward svc/prometheus-service 9090:9090 -n train-ticket &
curl http://localhost:9090/api/v1/targets
```

### Edge-remedy logs show "NO_LOGS" or score ~0.25

This is normal when there's no traffic. The model sees no anomaly signals and returns a healthy score. Send some traffic to see it change:

```bash
# Generate traffic
for i in $(seq 1 50); do curl -s http://localhost:8000/users > /dev/null; done

# Then inject chaos
curl -H "x-chaos-trigger: latency" http://localhost:8000/payments
```

### Port-forward dies after a while

```bash
# Restart it
kubectl port-forward svc/gateway-service 8000:8000 -n train-ticket &
```

---

## Teardown

### Stop Kubernetes

```bash
# Delete all resources
kubectl delete -f services/irctc/k8s/keda-scaledobjects.yaml
kubectl delete -f services/irctc/k8s/edge-remedy-deployment.yaml
kubectl delete -f services/irctc/k8s/wasmedge-daemonset.yaml
kubectl delete -f services/irctc/k8s/services-deployment.yaml
kubectl delete -f services/irctc/k8s/monitoring-configmaps.yaml
kubectl delete configmap wasm-sla-thresholds -n train-ticket
kubectl delete namespace train-ticket

# Uninstall KEDA
helm uninstall keda -n keda

# Stop minikube
minikube stop
```

### Stop Docker Compose

```bash
cd services/irctc
docker-compose down
```

---

## Quick Reference Card

```bash
# === START (K8s) ===
minikube start --cpus=4 --memory=6144
eval $(minikube docker-env)
kubectl apply -f services/irctc/k8s/
kubectl port-forward svc/gateway-service 8000:8000 -n train-ticket &

# === START (Docker Compose) ===
cd services/irctc && docker-compose up --build -d

# === CHECK STATUS ===
kubectl get pods,scaledobjects,hpa -n train-ticket

# === RUN ATTACK ===
curl -H "x-chaos-trigger: latency" http://localhost:8000/payments

# === WATCH THE MAGIC ===
kubectl logs -f deployment/edge-remedy-payment -n train-ticket

# === STOP ===
minikube stop                                    # K8s
cd services/irctc && docker-compose down         # Docker
```
