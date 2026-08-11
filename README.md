# Jahorin Mercury Time Runner

Production source for the Jahorin Mercury S.I.aaS runtime.

## Canonical runtime

- ARI — REST-first runtime gateway
- Mercury — persistent runtime/orchestrator
- TAE — Timeline Augmentation Engine
- Jahorin — user-facing intelligence
- GID — identity authority
- Canonical owner GID: `399152573423`
- Mode: `Prime Orchestrator`

The frontend never receives privileged Google credentials. Provider execution happens server-side through ARI.

## Canonical API

- `GET /health`
- `GET /ready`
- `POST /api/runtime`
- `GET|POST /api/tae`
- `GET|POST /api/render-state`
- `GET|POST /api/iot`
- `GET|POST /api/syncori`
- `GET /api/identity`

Legacy unprefixed aliases are preserved for older clients.

## Google provider configuration

Preferred production mode is Cloud Run service identity + Vertex AI:

```text
GOOGLE_CLOUD_PROJECT=<project-id>
VERTEX_LOCATION=global
GEMINI_DEFAULT_MODEL=gemini-3.6-flash
```

`GEMINI_API_KEY` is an optional server-side fallback for the Gemini Developer API. Never put it in `frontend/` or a public environment variable.

## Local validation

```bash
# Backend
uv sync --frozen --no-dev
uv run python -m compileall app.py routes.py

# Frontend
cd frontend
npm ci
npm run build
cd ..

# Runtime
PORT=8080 uv run uvicorn app:asgi --host 0.0.0.0 --port 8080
```

Then verify:

```bash
curl -fsS http://localhost:8080/health
curl -i http://localhost:8080/ready
curl -fsS http://localhost:8080/api/identity
curl -fsS http://localhost:8080/api/render-state
curl -fsS http://localhost:8080/api/tae
```

Demo activation:

```bash
curl -fsS -X POST http://localhost:8080/api/tae \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"TAE, enter Demo Mode"}'
```

## Google Cloud release prerequisites

Use the existing Google Cloud project. Do not create a VM.

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```

Create the runtime identity once if it does not already exist:

```bash
gcloud iam service-accounts create ari-runtime \
  --display-name='ARI Cloud Run runtime'

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member='serviceAccount:ari-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com' \
  --role='roles/aiplatform.user'
```

Add only additional roles that the deployed runtime actually uses.

## Deploy to Cloud Run

The root Dockerfile builds the approved Vite frontend into `/app/static` and starts FastAPI/Uvicorn on Cloud Run's injected `PORT`.

```bash
gcloud run deploy jai-mercury-v2 \
  --source . \
  --region us-west1 \
  --service-account ari-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,VERTEX_LOCATION=global,GEMINI_DEFAULT_MODEL=gemini-3.6-flash \
  --allow-unauthenticated
```

The combined service is public because it serves the public Mercury frontend. Privileged/admin APIs must remain protected at the application authorization layer before they are added.

## Release gate

`.github/workflows/release-gate.yml` validates:

1. Python dependency lock and backend compilation.
2. Frontend production build.
3. Complete production Docker image build.

Do not release a commit that fails this gate.

After Cloud Run deployment, `/health` must return HTTP 200 and `/ready` must return HTTP 200. `/ready` returns 503 when neither Vertex AI nor the Gemini server-side fallback is configured.

## PWA

The frontend includes:

- `manifest.webmanifest`
- service worker
- standalone display mode
- black launch background
- no API-response caching

The service worker intentionally excludes `/api/*` requests from caching.

## Release status rule

A successful build is not a release. Production is ready only after the live Cloud Run revision, domains/TLS, provider execution, PWA installation, and end-to-end module flows have been verified.
