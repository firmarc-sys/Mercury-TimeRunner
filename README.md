# Agentic Mercury Time Runner

Canonical zero-build production frontend for Agentic Mercury Time Runner S.I.aaS.

## Product architecture

- Agentic Mercury Time Runner — public product
- Mercury — persistent runtime / living application shell
- Jahorin — user-facing intelligence
- GID — identity authority
- TAE — Timeline Augmentation and orchestration layer
- ARI — REST-first intelligence and capability gateway
- SYNCORI — augmented Audio and Optics instrument suite

Jahorin remains the intelligence inside the product; it is not the public product name.

## Canonical production frontend

The production web root is `static/`.

Required runtime stack:

- HTML5
- CSS3
- Vanilla JavaScript
- Native ES Modules
- Native Web Components where useful
- Canvas / WebGL where required
- Fetch API
- IndexedDB
- Service Worker
- PWA Manifest
- browser-native device APIs

There is no required React, Vite, Webpack, Babel, npm compilation, or frontend bundling step.

The historical `frontend/` tree is legacy/reference material and MUST NOT be required for production deployment.

## Mercury shell law

The persistent application shell contains three sibling surfaces:

1. HEADER
2. VIEWPORT
3. LIQUID DOCK

The Liquid Dock never renders inside VIEWPORT. Capability content renders only inside VIEWPORT during normal in-app navigation.

## Canonical manifest

`static/repo-pages.json` is the source of truth and must contain exactly 25 capability pages:

- Core: 5
- SYNCORI Augmented Audio: 10
- SYNCORI Augmented Optics: 10

SYNCORI gateway rooms do not increase the canonical page count.

## API topology

The browser calls same-origin `/api/*` routes. The production host proxies those requests to ARI.

ARI production authority:

`https://ari-689058655022.us-west1.run.app`

Agentic Mercury Runtime:

`https://agentic-mercury-runtime-689058655022.us-west1.run.app`

Known production API surface includes:

- `GET /api/health`
- `GET /api/ready`
- `GET /api/identity`
- `POST /api/identity/session`
- `DELETE /api/identity/session`
- `GET|POST /api/render-state`
- `/api/tae`
- `/api/runtime`
- `/api/syncori`
- `/api/iot`

Do not expose provider credentials in browser-delivered code. Google, Gemini, Vertex, Stripe, Supabase service credentials, and other privileged secrets remain server-side behind ARI/runtime authorization.

## Vercel production deployment

Root `vercel.json` is the canonical Vercel deployment contract.

Production configuration:

- Framework preset: Other
- Repository root: repository root (`.`)
- Build command: none
- Install command: none
- Output directory: `static`
- Branch: `main`

`/api/:path*` is externally rewritten to the production ARI Cloud Run gateway before the persistent-shell fallback. API rewrite caching is disabled. The browser therefore continues to call only same-origin `/api/*`; it never calls Agentic Mercury Runtime directly.

The final catch-all rewrite resolves application navigation to `/index.html`, while Vercel continues to serve existing static assets and standalone capability files from `static/`.

For a consumer-facing production deployment, Vercel Authentication / Deployment Protection must not block the public production domain.

No Stripe, Supabase server, Vertex, Gemini, or Google Cloud secret belongs in Vercel environment variables for this frontend. Those credentials stay on ARI / Google Secret Manager.

## Netlify production deployment

Root `netlify.toml` remains canonical for Netlify.

Production configuration:

```toml
[build]
  base = "static"
  command = ""
  publish = "."
```

The `/api/*` proxy is declared before the persistent-shell fallback so API requests cannot be rewritten to HTML.

Canonical Netlify target:

- Project: `jahorin-mercury`
- Repository: `firmarc-sys/Mercury-TimeRunner`
- Branch: `main`
- Build command: none
- Published web root: `static/`

## Validation

`.github/workflows/release-gate.yml` validates backend syntax retained in this repository, the canonical zero-build SkillUI frontend, the 25-page manifest topology, required infrastructure, and the production container.

`static/skillui-validation.json` records machine-readable source-release state.

A passing source gate is not sufficient for final release. Production is complete only after the deployed revision is verified for shell integrity, canonical routes, PWA behavior, `/api/*` proxying, GID session behavior, camera/microphone permission flows, and truthful runtime failure states.

## Release rule

Do not redesign approved visual assets, add a framework requirement, add a 26th canonical capability page, nest the Liquid Dock inside VIEWPORT, expose browser secrets, or report simulated connectivity as real connectivity.
