import os
from typing import Iterable


def candidate_urls(env_key: str, docker_default: str, localhost_default: str) -> list[str]:
    configured = os.getenv(env_key)
    if configured:
        return [configured]
    return [docker_default, localhost_default]


PROMETHEUS_CANDIDATES = candidate_urls("PROMETHEUS_URL", "http://prometheus:9090", "http://localhost:9090")
LOKI_CANDIDATES = candidate_urls("LOKI_URL", "http://loki:3100", "http://localhost:3100")
JAEGER_CANDIDATES = candidate_urls("JAEGER_URL", "http://jaeger:16686", "http://localhost:16686")
