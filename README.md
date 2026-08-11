# NovaGen AI Drug Discovery Platform

Enterprise-grade, microservices-based AI drug discovery platform.

## Build status

This repo is being built in stages. Each stage is fully working before the next begins.

- [x] **Stage 1 — Backend**: repo layout, docker-compose (17 containers), shared libs (JWT/RBAC/logging/DB), full Postgres schema, and all 9 microservices with real logic:
  - `gateway` — reverse proxy, rate limiting, JWT-aware routing, explicit service allow-list
  - `auth-service` — JWT + refresh tokens, bcrypt, Google/Microsoft OAuth verification, RBAC
  - `drug-service` — disease/target CRUD, **real RDKit Tanimoto similarity screening**
  - `prediction-service` — RDKit featurization + trained RandomForest models (binding affinity, ADMET, toxicity, efficacy), BRICS-based generative molecule variants
  - `experiment-service` — experiment planning, sample tracking, QC recording
  - `analytics-service` — dashboard summary, pipeline progress, model performance (live Postgres aggregation queries)
  - `report-service` — real PDF (reportlab) and Excel (openpyxl) generation, stored in MinIO
  - `notification-service` — REST + WebSocket push notifications
  - `workflow-service` — pipeline stage orchestration (Redis-backed), the only service allowed to call automation-service
  - `automation-service` — **internal-only**, Celery worker + beat schedule, single call site for SNS Workbench (see `backend/automation-service/README.md` for the isolation guarantees)
  - `database/seed/seed.py` — dummy scientific dataset (diseases, compounds, admin user)
- [x] **Stage 2 — Landing page**: Next.js 15 + React 19 + TypeScript + Tailwind + Framer Motion + react-three-fiber
  - Design tokens follow the brief exactly: white / deep blue (`#0B3D91`) / light gray (`#F5F7FA`) / emerald (`#10B981`) accents, Space Grotesk + Inter + IBM Plex Mono type system
  - **Signature visual**: a rotating molecular scan animation (Animation 1) reused as the platform's recurring motif
  - **Animation 2**: interactive 7-stage workflow pipeline that auto-advances and lights up each module, matching the product's actual pipeline stages
  - **Animation 3**: real interactive 3D molecule (react-three-fiber/Three.js) — drag to rotate, scroll to zoom
  - Full section set from the spec: hero, platform architecture, workflow, AI engine, clinical recommendation, analytics, security, pricing, about, contact
  - `next.config.js` rewrites `/api/*` to the gateway so the frontend never needs to know individual service ports
- [x] **Stage 3 — Auth + Dashboard shell**: JWT login/register pages (with Google/Microsoft buttons wired to the backend's OAuth endpoints), token refresh interceptor, React Query data layer, and a working dashboard:
  - Overview: live stat cards, pipeline-progress bar chart, notifications panel, recent experiments — all real queries against `analytics-service`, `notification-service`, `experiment-service`
  - **Molecule Screening** page: enter a SMILES string, runs real Tanimoto similarity search against `drug-service`
  - **AI Predictions** page: enter a SMILES string, runs the real trained models in `prediction-service` (binding affinity, ADMET, toxicity, efficacy, confidence)
  - Fixed a routing bug found during this stage: downstream services were double-prefixing `/api/v1`, now corrected so every gateway path resolves correctly
  - Added the missing `prediction-service/app/main.py` entrypoint (was omitted in Stage 1)
- [ ] **Stage 4 — AI pipeline vertical slice**: Molecule Screening → AI Prediction Engine, real RDKit + scikit-learn/PyTorch models
- [x] **Stage 4 — Remaining dashboard pages**: Experiments, Reports, **Clinical Recommendation** (transparent heuristic — see caveat below), **Target Identification**, **Molecular Docking**, **Notifications** (full page + mark-as-read), **Settings** (real profile-update endpoint)
- [x] **Stage 5 — Deployment**:
  - **Kubernetes**: full manifest set in `deployment/k8s/base/` — namespace, ConfigMap/Secret, StatefulSets for Postgres/Mongo/Neo4j/MinIO, Deployment for Redis, a generated Deployment+Service per microservice (`generate_service_manifests.py` keeps them consistent), frontend Deployment, Ingress (deliberately no rule for automation-service), HPA for gateway + prediction-service, and a `kustomization.yaml` tying it together
  - **NGINX**: production reverse-proxy config for non-K8s/single-VM deployment, with rate limiting and security headers
  - **GitHub Actions CI/CD**: lint + test every backend service, lint + build the frontend, build & push all 11 images to GHCR, then deploy via kubectl — gated so failing tests block deploy
  - **Monitoring**: Prometheus scrape config (automation-service excluded from external scrape targets) + baseline alert rules
  - Frontend production Dockerfile (multi-stage, Next.js standalone output)

## What's left
- Google/Microsoft OAuth SDK wiring on the frontend (backend endpoints already exist)
- Swagger/OpenAPI is auto-generated per-service by FastAPI at `/docs` — an aggregated gateway-level API doc page is not yet built
- Real labeled training data for the prediction models (currently a small synthetic seed set — see `backend/prediction-service/app/core/train_baseline.py`)
- Broader automated test coverage — only `auth-service` and `prediction-service` have tests so far; the pattern (see their `tests/conftest.py`) is ready to extend to the rest
- Receptor-preparation automation for docking (deliberately left as a manual step — see the docking caveat below and `RUNNING.md` §6)

## Scientific integrations added — what's real vs. what needs your input

I will not claim this platform is error-free or hallucination-free — that's not an honest claim for a system this size that I can't execute or network-test in my own environment. Here's exactly what's genuine and what still depends on you:

- **Lipinski's Rule of Five, Veber's rule, Ghose filter** (`prediction-service/app/core/druglikeness.py`) — fully deterministic threshold checks on real RDKit descriptors. No model, no training data, nothing to hallucinate. Endpoint: `POST /prediction/druglikeness`.
- **PubMed literature search** (`drug-service/app/services/literature.py`) — real calls to NCBI's public E-utilities (esearch + esummary). Every result is a genuine PubMed record fetched live; empty results return an empty list rather than an invented citation. Endpoint: `POST /drug/literature`.
- **Molecular docking** (`prediction-service/app/services/docking.py`) — real AutoDock Vina + Meeko integration, not a fabricated score generator. It deliberately **requires you to supply**: (1) a receptor already prepared as PDBQT (protonation, missing residues, and cofactor placement need structural-biology judgment that shouldn't be automated silently), and (2) the binding-site search box coordinates (from your own knowledge or the `binding_sites` table). I have not been able to install/run `vina`/`meeko` in this sandbox (no network access) — the code is written to their documented APIs but you should validate it in your own environment before trusting its output. Endpoint: `POST /prediction/dock`.
- **ADMET** — unchanged from Stage 1: a RandomForest trained on a small synthetic seed set (see the existing caveat in `train_baseline.py`). The new Lipinski/Veber/Ghose rules are a real, independent cross-check against that model's output — when they disagree, trust the rule-based result over the ML one until the model is retrained on real ChEMBL/Tox21 data.

Every file added in this pass was syntax-checked and its new routes traced end-to-end, but static checks can't catch everything a live network/dependency environment would — please treat this as thoroughly-reviewed code ready for you to test, not as already-validated in production.

## Architecture

```
novagen/
├── frontend/            Next.js 15 + React 19 + TypeScript + Tailwind + Shadcn
├── backend/
│   ├── gateway/          API gateway (auth, rate limiting, routing)
│   ├── auth-service/      JWT, OAuth (Google/Microsoft), RBAC
│   ├── drug-service/      Disease/target identification, molecule screening
│   ├── prediction-service/ ML: binding affinity, ADMET, toxicity, generative molecules
│   ├── analytics-service/ Dashboards, model performance metrics
│   ├── experiment-service/ Lab validation, sample tracking
│   ├── report-service/    PDF/Excel scientific reports
│   ├── notification-service/ Email/push/websocket notifications
│   ├── workflow-service/  Pipeline orchestration (disease → clinical)
│   ├── automation-service/ Internal-only: connects to SNS Workbench (never exposed to frontend)
│   └── shared/            Shared auth, config, logging, DB clients
├── database/
│   ├── postgres/          Relational: users, projects, experiments, trials, audit logs
│   ├── mongo/              Documents: reports, unstructured scientific data
│   ├── neo4j/              Graphs: protein networks, pathway analysis
│   └── seed/               Dummy scientific dataset
└── deployment/
    ├── docker/, k8s/, nginx/, github-actions/, monitoring/
```

## Running locally (Stage 1)

See **[RUNNING.md](./RUNNING.md)** for the full step-by-step guide (environment setup, seeding, trying each module, and a troubleshooting table). Quick version:

```bash
cp .env.example .env
docker compose up --build
```

**Prefer running the databases and services natively instead of Docker?** See **[deployment/native/README.md](./deployment/native/README.md)** — install steps for PostgreSQL/MongoDB/Neo4j/Redis/MinIO on macOS/Windows/Linux, plus `start-all.sh` / `start-all.ps1` to launch all 10 backend services without containers.

- Gateway: http://localhost:8000
- Each service health check: http://localhost:80xx/health
- Postgres: localhost:5432 | Mongo: localhost:27017 | Neo4j: http://localhost:7474 | Redis: localhost:6379 | MinIO console: http://localhost:9001

> Frontend is added in Stage 2. Until then, the gateway and services are API-only.

## Important design note

**SNS Workbench is never exposed to the frontend or the API gateway's public routes.** It is only ever called from inside `automation-service`, which itself is only reachable service-to-service (not through the public gateway). See `backend/automation-service/README.md`.
