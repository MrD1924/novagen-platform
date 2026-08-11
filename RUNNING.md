# Running NovaGen locally

This walks through getting the whole stack up on your own machine. My sandbox
has no network access, so nothing in this guide has been executed by me end
to end — I've syntax-checked and traced every route, but you'll be the one to
confirm it boots cleanly. Budget 20–30 minutes the first time, mostly spent
waiting on Docker image builds (RDKit and PyTorch are large).

## 0. Prerequisites

- Docker + Docker Compose v2 (`docker compose version` should work)
- Node.js 20+ and npm (only needed if you run the frontend outside Docker, which is the easier path for local dev)
- ~10GB free disk space (RDKit/PyTorch/Neo4j images add up)
- Ports free on your machine: 3000, 5432, 6379, 7474, 7687, 8000–8009, 9000, 9001, 27017

## 1. Configure environment variables

```bash
cd novagen
cp .env.example .env
```

Open `.env` and at minimum change:
- `POSTGRES_PASSWORD`, `MONGO_INITDB_ROOT_PASSWORD`, `NEO4J_AUTH`, `MINIO_ROOT_PASSWORD` — pick real passwords, not the placeholders
- `JWT_SECRET` — generate one: `openssl rand -hex 32`

Everything else has a working default for local dev. Leave `SNS_WORKBENCH_WEBHOOK_URL` blank unless you actually have a deployed SNS Agent Workbench webhook — automation-service no-ops gracefully without it. `NCBI_API_KEY` is optional (raises the PubMed rate limit from 3 to 10 req/sec; get one free at https://www.ncbi.nlm.nih.gov/account/settings/).

## 2. Start the backend + databases

```bash
docker compose up --build
```

First build will take a while (RDKit + PyTorch images are large — expect 10–15 minutes on a typical connection). Watch the logs for each service reporting it's listening. You can sanity-check individual services once they're up:

```bash
curl http://localhost:8000/health   # gateway
curl http://localhost:8001/health   # auth-service
curl http://localhost:8002/health   # drug-service
curl http://localhost:8003/health   # prediction-service (no /health DB dependency, should be fastest to go green)
```

If a service keeps restarting, `docker compose logs <service-name>` will show you why — most likely causes: a typo'd `.env` value, or Postgres not being ready yet (the `depends_on: condition: service_healthy` should prevent this, but if it doesn't, `docker compose restart <service-name>` once Postgres is confirmed healthy).

## 3. Seed the database

```bash
docker compose exec auth-service python /database/seed/seed.py
```

If that path doesn't resolve (the seed script lives outside any single service's Docker image), instead run it against the shared network from a throwaway container:

```bash
docker compose exec auth-service python -c "
import sys; sys.path.append('/app')
" # confirms /app/shared is reachable inside the container

# then, from the host, with Python + the backend/shared deps installed locally:
cd backend && DATABASE_URL=postgresql+asyncpg://novagen:<your-password>@localhost:5432/novagen \
  python ../database/seed/seed.py
```

This creates an admin user (`admin@novagen.ai`, password from `SEED_ADMIN_PASSWORD` env var or `ChangeMe123!` by default), two example diseases, and three example compounds (aspirin, caffeine, ibuprofen) — enough to test screening and predictions immediately.

## 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000 for the marketing site, or http://localhost:3000/login to sign in directly.

(The frontend is commented out of `docker-compose.yml` deliberately — Next.js dev mode with hot reload is a much better experience run natively than in a container. Uncomment the `frontend:` service block and use `frontend/Dockerfile` if you want it containerized too.)

## 5. Log in and try each module

1. **Register** an account at `/register` (pick "Researcher" or "Scientist"), or log in with the seeded admin account.
2. **Molecule Screening** (`/dashboard/screening`) — the seed data includes aspirin/caffeine/ibuprofen; try screening against `CC(=O)Oc1ccccc1C(=O)O` (aspirin's own SMILES) and you should get a similarity of 1.000 back against itself.
3. **AI Predictions** (`/dashboard/predictions`) — paste any valid SMILES; you'll get the RandomForest ADMET/toxicity/efficacy/binding-affinity scores plus the real Lipinski/Veber/Ghose druglikeness panel underneath.
4. **Literature** (`/dashboard/literature`) — search anything (e.g. "EGFR inhibitor") and you should get real, live PubMed results. If this errors, check your network allows outbound HTTPS to `eutils.ncbi.nlm.nih.gov`.
5. **Target Identification** (`/dashboard/targets`) — add a protein target manually (name + UniProt ID).
6. **Docking** (`/dashboard/docking`) — **will not work out of the box.** It needs a real receptor PDBQT file on the prediction-service container's filesystem and real binding-site coordinates — see "Setting up docking" below. Expect a 503 (packages not installed) or 422 (receptor not found) until you do that setup.
7. **Clinical Recommendation** (`/dashboard/clinical`) — needs a compound ID; grab one from the Postgres `compounds` table (`docker compose exec postgres psql -U novagen -d novagen -c "SELECT id, name FROM compounds;"`) after seeding.
8. **Reports** (`/dashboard/reports`) — generates a real PDF or Excel file and gives you a MinIO-backed download link.

## 6. Setting up docking (optional, advanced)

This is the one module that genuinely can't be made to "just work" without real structural-biology input — see `backend/prediction-service/app/services/docking.py` for why. To actually try it:

1. Add `vina` and `meeko` to `backend/prediction-service/requirements.txt` if they're not already there (they are, but confirm the pinned versions have wheels for the Python version in that service's Dockerfile — check before building).
2. Get a prepared receptor. The honest path: download a PDB structure from RCSB (`https://files.rcsb.org/download/<PDB_ID>.pdb`), then prepare it with a real tool — ADFR's `prepare_receptor` or Open Babel — to produce a PDBQT with hydrogens and charges assigned. This is a real structural-biology step; don't skip it or trust an unprepared file.
3. Mount that PDBQT into the `prediction-service` container (add a volume in `docker-compose.yml`, e.g. `./data/receptors:/data/receptors`) and pass its in-container path as `receptor_pdbqt_path`.
4. Find the binding site's center coordinates (from the PDB's known ligand position, or the `binding_sites` table if you've populated it) and pass those as `center_x/y/z`.

## 7. Running tests

```bash
cd backend/auth-service && pip install -r requirements.txt pytest --break-system-packages && pytest tests/
cd backend/prediction-service && pip install -r requirements.txt pytest --break-system-packages && pytest tests/
```

Only these two services have tests written so far (JWT round-trip, druglikeness rule checks). The rest have empty `tests/` folders — CI (`deployment/github-actions/ci-cd.yml`) will skip them until you add tests, matching the existing pattern.

## 8. Common problems

| Symptom | Likely cause |
|---|---|
| Every gateway request 404s | Check `backend/gateway/app/routes_map.py` matches your service names, and that each service's `main.py` doesn't have a redundant `/api/v1` prefix on its router (this was a real bug I found and fixed during Stage 3 — worth double-checking if you've modified routes) |
| `docker compose up` fails on `prediction-service` build | The `vina` pinned version may not have a wheel for the Dockerfile's Python version — see the caveat comment in `requirements.txt` |
| Frontend shows "Invalid email or password" immediately on load | The access token in localStorage expired and refresh failed — clear localStorage (`novagen_access_token`, `novagen_refresh_token`) and log in again |
| PubMed search errors | NCBI rate-limits unauthenticated requests to 3/sec — add `NCBI_API_KEY` in `.env`, or just retry |
| Docking always 503 | `vina`/`meeko` aren't installed in the running container — rebuild `prediction-service` after confirming they're in `requirements.txt` |

If something in this guide doesn't match what actually happens when you run it, that's genuinely useful signal — I wrote this from static analysis of the code, not from watching it run, so discrepancies are expected and worth fixing.

## Running without Docker

Everything above assumes Docker. If you need PostgreSQL/MongoDB/Neo4j/Redis/MinIO installed natively on your machine instead, see **[deployment/native/README.md](./deployment/native/README.md)** — full install steps per OS, a localhost-based `.env` template, and `start-all.sh`/`start-all.ps1` scripts that launch all 10 backend services as local processes.
