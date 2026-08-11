import os

# Deliberately explicit allow-list of what the public gateway may proxy to.
# automation-service is NEVER added here — it is only ever called service-to-service
# from workflow-service / experiment-service / report-service internally, and the
# frontend has no route, code path, or visible reference to it anywhere.
ROUTE_MAP: dict[str, str] = {
    "auth": os.environ.get("AUTH_SERVICE_URL", "http://auth-service:8001"),
    "drug": os.environ.get("DRUG_SERVICE_URL", "http://drug-service:8002"),
    "prediction": os.environ.get("PREDICTION_SERVICE_URL", "http://prediction-service:8003"),
    "analytics": os.environ.get("ANALYTICS_SERVICE_URL", "http://analytics-service:8004"),
    "experiment": os.environ.get("EXPERIMENT_SERVICE_URL", "http://experiment-service:8005"),
    "report": os.environ.get("REPORT_SERVICE_URL", "http://report-service:8006"),
    "notification": os.environ.get("NOTIFICATION_SERVICE_URL", "http://notification-service:8007"),
    "workflow": os.environ.get("WORKFLOW_SERVICE_URL", "http://workflow-service:8008"),
}
