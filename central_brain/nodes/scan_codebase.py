import os
from clients.config import SERVICES_BASE_PATH

SERVICE_DIRS = [
    "gateway-service", "user-service", "auth-service", "station-service",
    "train-service", "schedule-service", "ticket-service", "order-service",
    "payment-service", "notification-service",
]


async def scan_codebase(state: dict) -> dict:
    """Node 3: Read relevant source files from the affected service and its dependencies."""
    service = state["service_name"]

    # Match service name to directory (handle with/without -service suffix)
    dir_name = service if service in SERVICE_DIRS else f"{service}-service"
    if dir_name not in SERVICE_DIRS:
        dir_name = service  # fallback to raw name

    service_path = os.path.join(SERVICES_BASE_PATH, dir_name)
    relevant_files = []
    service_dependencies = []

    # Read main.py of the affected service
    main_path = os.path.join(service_path, "main.py")
    if os.path.isfile(main_path):
        with open(main_path, "r", encoding="utf-8") as f:
            content = f.read()
        relevant_files.append({
            "path": main_path,
            "content": content,
            "reason": "Primary service entrypoint with all routes and middleware",
        })

        # Extract downstream dependencies from SERVICE_URL env vars
        for line in content.split("\n"):
            if "_SERVICE_URL" in line and "http://" in line:
                for svc_dir in SERVICE_DIRS:
                    if svc_dir in line:
                        service_dependencies.append(svc_dir)

    # Always include shared middleware
    common_dir = os.path.join(SERVICES_BASE_PATH, "common")
    for common_file in ["chaos.py", "logger.py"]:
        cpath = os.path.join(common_dir, common_file)
        if os.path.isfile(cpath):
            with open(cpath, "r", encoding="utf-8") as f:
                content = f.read()
            relevant_files.append({
                "path": cpath,
                "content": content,
                "reason": f"Shared middleware/utility ({common_file}) used by all services",
            })

    # Read main.py of each downstream dependency
    for dep in service_dependencies:
        dep_main = os.path.join(SERVICES_BASE_PATH, dep, "main.py")
        if os.path.isfile(dep_main):
            with open(dep_main, "r", encoding="utf-8") as f:
                content = f.read()
            relevant_files.append({
                "path": dep_main,
                "content": content,
                "reason": f"Downstream dependency called by {service}",
            })

    return {
        "relevant_files": relevant_files,
        "service_dependencies": service_dependencies,
    }
