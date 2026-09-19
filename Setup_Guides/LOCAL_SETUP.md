# Local Setup Guide

The recommended local setup runs the complete application with Docker Compose.

## Quick start

Install Git and Docker Desktop, or Docker Engine with the Compose plugin on
Linux. Confirm Docker is running:

```bash
docker info
docker compose version
```

From the repository root, create the environment file:

```bash
cp .env.example .env
```

Replace every example value in `.env`:

```dotenv
POSTGRES_USER=db_user
POSTGRES_PASSWORD=strong_password
POSTGRES_DB=appdb
DELETE_PASSWORD=different_strong_password
```

Start the application:

```bash
docker compose up -d --build
docker compose ps
```

Open:

- App: <http://localhost:8000>
- Health check: <http://localhost:8000/api/health>
- API docs: <http://localhost:8000/docs>

## Common commands

```bash
# Rebuild the app after source changes
docker compose up -d --no-deps --build web

# View logs
docker compose logs -f web
docker compose logs -f db

# Stop while preserving database data
docker compose down

# Start again
docker compose up -d
```

`docker compose down -v` permanently deletes the local PostgreSQL volume. Use
it only when you intentionally want an empty database.

## Linux setup scripts

The Bash installer supports Ubuntu and compatible Debian-based Linux systems.
It does not support Windows, macOS, or Amazon Linux.

| Mode | Purpose |
| --- | --- |
| `local` | Local Docker deployment |
| `local_live` | Local deployment with private Tailscale access |
| `ec2` | AWS deployment with Tailscale and swap |

For a normal Linux setup:

```bash
./installDependencies.sh local
# Log out and back in after installation
./firstDeploy.sh local
```

The argument defaults to `local` when omitted.

For private access from other Tailscale devices:

```bash
./installDependencies.sh local_live
# Log out, reconnect, and authenticate Tailscale if requested
./firstDeploy.sh local_live
tailscale ip -4
```

Open `http://TAILSCALE_IP:8000` from another device on the tailnet.

For later updates to a deployed checkout:

```bash
./redeploy.sh local_live
./redeploy.sh local_live --restart-db  # Optional database restart
```

Because `redeploy.sh` runs `git pull`, use direct Docker commands when working
with uncommitted changes.

## Frontend development

Keep the Docker application running for the backend, then start Vite:

```bash
cd Frontend/ava-03
npm ci
npm run dev
```

Open the Vite URL, normally <http://localhost:5173>. `/api` requests are proxied
to the backend on port `8000`.

For local telemetry, use this in `Frontend/ava-03/.env.local`:

```dotenv
VITE_WS_URL=ws://localhost:8000/api/ws/livetelemetry
```

`.env.local` is ignored by Git. Keep real API keys out of committed files.

## Optional native backend

For backend auto-reload outside Docker, install Python 3.11+, `uv`, and a local
PostgreSQL server. Then run from the repository root:

```bash
cd Backend
uv sync --locked
cd ..
export DATABASE_URL="postgresql://USER:PASSWORD@localhost/DATABASE"
export DELETE_PASSWORD="your_delete_password"
uv run --project Backend uvicorn Backend.main:app --reload --port 8000
```

PowerShell environment variables:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@localhost/DATABASE"
$env:DELETE_PASSWORD = "your_delete_password"
```

Use the Vite development server for the frontend in this workflow.

## Protobuf generation

```bash
cd Frontend/ava-03
npm ci
cd ../..
buf generate
```

The current `buf.gen.yaml` plugin path ends in `.cmd` and is configured for
Windows. On Linux or macOS, change it to
`Frontend/ava-03/node_modules/.bin/protoc-gen-es` first.

## Troubleshooting

If the application does not become healthy:

```bash
docker compose ps
docker compose logs --tail=100 db
docker compose logs --tail=100 web
curl -v http://localhost:8000/api/health
```

If Docker is unavailable, start Docker Desktop or, on Linux:

```bash
sudo systemctl start docker
docker info
```

If frontend dependencies or the build are inconsistent:

```bash
cd Frontend/ava-03
npm ci
npm run build
```
