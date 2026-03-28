from fastapi import APIRouter, Query
from typing import Optional
from services.loki_client import query_logs

router = APIRouter()


@router.get("")
async def get_logs(
    service: Optional[str] = Query(default=None),
    level: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=200),
):
    """Return recent structured logs from Loki."""
    label_selectors = []
    if service:
        label_selectors.append(f'service_name=~".*{service}.*"')
    if level:
        label_selectors.append(f'level="{level}"')

    if label_selectors:
        query = '{' + ','.join(label_selectors) + '}'
    else:
        query = '{service_name=~".+"}'

    try:
        result = await query_logs(query, limit=limit)
        logs = []
        for stream in result:
            labels = stream.get("stream", {})
            for ts, line in stream.get("values", []):
                logs.append({
                    "timestamp": ts,
                    "service_name": labels.get("service_name", labels.get("container_name", "unknown")),
                    "level": labels.get("level", "info"),
                    "message": line,
                    "labels": labels,
                })
        # Sort by timestamp descending
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        return logs[:limit]
    except Exception:
        return []
