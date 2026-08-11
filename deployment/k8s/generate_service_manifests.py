#!/usr/bin/env python3
"""Generates deployment/k8s/base/2x-<service>.yaml for every backend microservice.
Re-run after adding a new service to backend/ so its manifest stays consistent
with the others. Image tags are expected to be pushed by CI as
ghcr.io/<org>/novagen-<service>:<git-sha> — see github-actions/ci-cd.yml.
"""
import os

SERVICES = {
    "gateway":              {"port": 8000, "replicas": 2, "public": True,  "needs_postgres": False},
    "auth-service":         {"port": 8001, "replicas": 2, "public": False, "needs_postgres": True},
    "drug-service":         {"port": 8002, "replicas": 2, "public": False, "needs_postgres": True},
    "prediction-service":   {"port": 8003, "replicas": 2, "public": False, "needs_postgres": False},
    "analytics-service":    {"port": 8004, "replicas": 2, "public": False, "needs_postgres": True},
    "experiment-service":   {"port": 8005, "replicas": 2, "public": False, "needs_postgres": True},
    "report-service":       {"port": 8006, "replicas": 1, "public": False, "needs_postgres": True},
    "notification-service": {"port": 8007, "replicas": 2, "public": False, "needs_postgres": True},
    "workflow-service":     {"port": 8008, "replicas": 2, "public": False, "needs_postgres": False},
    # automation-service is deliberately NOT public and not given an Ingress/gateway route.
    "automation-service":   {"port": 8009, "replicas": 1, "public": False, "needs_postgres": False},
}

OUT_DIR = os.path.join(os.path.dirname(__file__), "base")

TEMPLATE = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: {name}
  namespace: novagen
  labels: {{ app: {name} }}
spec:
  replicas: {replicas}
  selector:
    matchLabels: {{ app: {name} }}
  template:
    metadata:
      labels: {{ app: {name} }}
    spec:
      containers:
        - name: {name}
          image: ghcr.io/novagen/novagen-{name}:latest
          ports: [{{ containerPort: {port} }}]
          envFrom:
            - configMapRef: {{ name: novagen-config }}
            - secretRef: {{ name: novagen-secrets }}
          readinessProbe:
            httpGet: {{ path: /health, port: {port} }}
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet: {{ path: /health, port: {port} }}
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests: {{ cpu: "100m", memory: "256Mi" }}
            limits: {{ cpu: "500m", memory: "512Mi" }}
---
apiVersion: v1
kind: Service
metadata:
  name: {name}
  namespace: novagen
spec:
  selector: {{ app: {name} }}
  ports: [{{ port: {port}, targetPort: {port} }}]
"""

# automation-service gets no Service of type LoadBalancer/NodePort anywhere, and is
# additionally excluded from any Ingress rule below — see 30-ingress.yaml.

if __name__ == "__main__":
    for i, (name, cfg) in enumerate(SERVICES.items(), start=20):
        content = TEMPLATE.format(name=name, port=cfg["port"], replicas=cfg["replicas"])
        path = os.path.join(OUT_DIR, f"{i}-{name}.yaml")
        with open(path, "w") as f:
            f.write(content)
        print("wrote", path)
