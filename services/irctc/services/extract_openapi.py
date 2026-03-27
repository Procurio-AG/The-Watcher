import importlib.util
import json
import os
import sys

base_dir = os.path.dirname(os.path.abspath(__file__))

# Add the 'services' dir to sys.path so 'common' can be resolved
sys.path.insert(0, base_dir)

services = [
    "user-service", "auth-service", "station-service", 
    "train-service", "schedule-service", "ticket-service", 
    "order-service", "payment-service", "notification-service"
]

all_docs = {}

for s in services:
    try:
        module_path = os.path.join(base_dir, s, "main.py")
        spec = importlib.util.spec_from_file_location(s.replace("-", "_") + "_main", module_path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        app = module.app
        all_docs[s] = app.openapi()
    except Exception as e:
        print(f"Failed to load {s}: {e}")

with open(os.path.join(base_dir, "..", "openapi_summary.json"), "w") as f:
    json.dump(all_docs, f, indent=2)
