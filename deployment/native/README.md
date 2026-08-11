# Running NovaGen natively — no Docker

This installs PostgreSQL, MongoDB, Neo4j, Redis, and MinIO directly on your OS
as real, standalone services, and runs each of the 10 Python microservices as
its own local process with `uvicorn`. This is more setup than Docker and more
moving parts to keep track of, but nothing here is a simulation — these are
the exact same database engines Docker would have run, just installed
directly instead of containerized.

I have not been able to execute any of these install commands myself (no
network/no admin access in my sandbox) — they're written correctly against
each project's official documentation, but you're the one confirming they
work on your actual machine. If a command is out of date for your OS version,
the official install pages are linked in each section.

---

## 1. Install the databases

Pick your OS section below. You need all five: PostgreSQL, MongoDB, Neo4j, Redis, MinIO.

### macOS (Homebrew)

```bash
brew install postgresql@16 mongodb-community@7.0 redis minio/stable/minio
brew install --cask neo4j    # installs Neo4j Desktop (GUI) — see note below

brew services start postgresql@16
brew services start mongodb-community@7.0
brew services start redis
```

If `mongodb-community` isn't found, tap it first: `brew tap mongodb/brew`.

**Neo4j on macOS**: Neo4j Desktop is the easiest path — open it, create a new
local DBMS (version 5.x), set a password, and click Start. Alternatively,
install the Community Server directly: `brew install neo4j` and
`neo4j start`.

**MinIO**: `brew services start minio` uses default settings. To set custom
credentials, run it manually instead:
```bash
MINIO_ROOT_USER=novagen MINIO_ROOT_PASSWORD=<your-password> minio server ~/minio-data --console-address ":9001"
```

### Windows

- **PostgreSQL**: download the installer from https://www.postgresql.org/download/windows/ (EDB installer). During setup, set a password for the `postgres` superuser and note the port (default 5432).
- **MongoDB**: download "MongoDB Community Server" from https://www.mongodb.com/try/download/community. Install as a Windows Service (the installer offers this) so it starts automatically.
- **Neo4j**: download **Neo4j Desktop** from https://neo4j.com/download/. Create a local DBMS, set a password, click Start.
- **Redis**: Redis doesn't officially support Windows anymore. Easiest options: (a) use **WSL2** (Windows Subsystem for Linux) and follow the Linux instructions below inside it, or (b) use the community port at https://github.com/tporadowski/redis/releases (unofficial but widely used for local dev).
- **MinIO**: download `minio.exe` from https://min.io/download#/windows, then run it from PowerShell:
  ```powershell
  $env:MINIO_ROOT_USER="novagen"; $env:MINIO_ROOT_PASSWORD="<your-password>"
  .\minio.exe server C:\minio-data --console-address ":9001"
  ```

### Linux (Debian/Ubuntu)

```bash
# PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# MongoDB (add the official repo first — apt's default repos often have an old version)
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# Redis
sudo apt install -y redis-server
sudo systemctl enable --now redis-server

# Neo4j (see https://neo4j.com/docs/operations-manual/current/installation/linux/debian/ for the full repo setup)
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable 5' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt update && sudo apt install -y neo4j
sudo systemctl enable --now neo4j

# MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
MINIO_ROOT_USER=novagen MINIO_ROOT_PASSWORD=<your-password> minio server ~/minio-data --console-address ":9001" &
```

---

## 2. Set initial passwords / users

Each database needs an actual user/password matching what you'll put in `.env`.

**PostgreSQL** — create the `novagen` user and database:
```bash
sudo -u postgres psql   # Linux; on Mac/Windows just run `psql -U postgres`
```
```sql
CREATE USER novagen WITH PASSWORD 'your-password-here';
CREATE DATABASE novagen OWNER novagen;
\q
```

**MongoDB** — create an admin user (skip if you're fine with no-auth for local dev):
```bash
mongosh
```
```javascript
use admin
db.createUser({ user: "novagen", pwd: "your-password-here", roles: ["root"] })
```

**Neo4j** — set the password on first login: visit http://localhost:7474, log in with `neo4j`/`neo4j` (default), it will force you to set a new password immediately.

**Redis** — no auth needed for local dev by default (leave `requirepass` unset in `redis.conf`, or set one and update `.env` accordingly).

**MinIO** — credentials are whatever you passed as `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` when starting it.

---

## 3. Apply the Postgres schema

Docker did this automatically via `docker-entrypoint-initdb.d`. Natively, run it yourself:

```bash
psql -U novagen -d novagen -h localhost -f database/postgres/init/001_schema.sql
```

---

## 4. Point the app at localhost instead of container hostnames

Copy the native env template and fill in the real passwords you set in step 2:

```bash
cp deployment/native/.env.native.example .env
```

The difference from the Docker `.env.example` is every hostname (`postgres`, `mongo`, `neo4j`, `redis`, `minio`) becomes `localhost`, since there's no Docker network giving those names meaning anymore.

---

## 5. Install Python + Node.js if you haven't already

- **Python 3.12**: https://www.python.org/downloads/ (Windows/Mac installer, or `sudo apt install python3.12 python3.12-venv` on Linux)
- **Node.js 20+**: https://nodejs.org/

---

## 6. Run the backend services

Each of the 10 services (`gateway` + 9 microservices) is a separate FastAPI app with its own `requirements.txt`, and each one imports the shared `backend/shared` library by relative path — so you need `backend/` on `PYTHONPATH` for every service, not just `/app` (that path only existed inside the Docker image).

**Manually, one service at a time** (repeat per service, in separate terminals):
```bash
cd backend/auth-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
PYTHONPATH=.. uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

That's the same pattern for all 10 — see the port table in `deployment/native/start-all.sh` / `start-all.ps1`.

**Or, faster: use the provided scripts** (`deployment/native/start-all.sh` for Mac/Linux, `start-all.ps1` for Windows) which create a venv per service, install dependencies, and launch all 10 as background processes with one command. See that directory's own README for usage.

---

## 7. Seed the database

```bash
cd backend
PYTHONPATH=. DATABASE_URL=postgresql+asyncpg://novagen:<your-password>@localhost:5432/novagen \
  python ../database/seed/seed.py
```

---

## 8. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000.

---

## 9. Automation-service's Celery worker

If you want the background job worker running too (not required for the core app to function):
```bash
cd backend/automation-service
source venv/bin/activate
PYTHONPATH=.. celery -A app.worker.celery_app worker --loglevel=info
```

---

## Troubleshooting native-specific issues

| Symptom | Cause |
|---|---|
| `ModuleNotFoundError: No module named 'shared'` | You forgot `PYTHONPATH=..` (or the Windows equivalent — see `start-all.ps1`) when launching a service |
| Postgres connection refused | Check `pg_hba.conf` allows password auth on localhost (`host all all 127.0.0.1/32 md5`), and that the service is actually running (`pg_isready`) |
| A service shows `FAILED` in `check-all.ps1` but its own log says `Uvicorn running` with no errors | Real issue hit during development: on some Windows machines, `localhost` resolves to the IPv6 loopback (`::1`) first, and requests to that address can hang indefinitely even though the same service answers instantly on `127.0.0.1`. Test directly: `curl http://127.0.0.1:<port>/health -TimeoutSec 5` vs. the `localhost` version — if only the IPv4 one responds, this is it. `check-all.ps1` already uses `127.0.0.1` for this reason. If your browser-based frontend also seems to intermittently hang talking to the gateway, try setting `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` instead of `localhost` in `.env` as a workaround, or fix it properly by disabling/deprioritizing IPv6 for the loopback adapter in Windows network settings |
| Neo4j `.driver` connection errors | Confirm you changed the default password on first login — the driver will reject the default `neo4j`/`neo4j` credentials |
| MinIO bucket errors | The bucket is auto-created by `report-service` on first use (`ensure_bucket()` in `app/core/storage.py`) — make sure MinIO itself is actually running first |
