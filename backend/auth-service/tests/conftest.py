"""Ensures both this service's `app` package and the shared `backend/shared`
library import correctly whether pytest is run from the repo root (CI) or
from inside this service's directory (local dev) — without relying on the
Docker-image-only /app path used at runtime."""
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_SERVICE_ROOT = os.path.dirname(_HERE)  # .../backend/auth-service
_BACKEND_ROOT = os.path.dirname(_SERVICE_ROOT)  # .../backend

for path in (_SERVICE_ROOT, _BACKEND_ROOT):
    if path not in sys.path:
        sys.path.insert(0, path)
