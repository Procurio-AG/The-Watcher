#!/bin/bash
set -e

echo "Installing edge-remedy dependencies..."
npm install

echo "Starting Edge Telemetry Poller..."
export PROMETHEUS_URL="http://localhost:9090"
export LOKI_URL="http://localhost:3100"
export JAEGER_URL="http://localhost:16686"
export TARGET_SERVICE="payment-service"

npm start
