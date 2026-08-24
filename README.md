# Jahorin Trismegistus

Canonical zero-build production frontend for **Jahorin Trismegistus — System Intelligence as a Service**.

## Runtime hierarchy

- **ARI** — browser-facing REST gateway and provider authority
- **MERCURY P.I.** — persistent living runtime and material shell
- **TAE** — temporal/contextual orchestration
- **JAHORIN TRISMEGISTUS** — user-facing orchestrating intelligence
- **GID** — identity authority

Canonical owner/demo identity: **GID 399152573423 · PRIME ORCHESTRATOR**.

Core law:

`HUMAN → INTENTION → UNDERSTANDING → ORCHESTRATION → CAPABILITY → ACTION → RESULT`

## Production frontend

The production web root is `static/`.

The runtime is intentionally zero-build:

- HTML5 / CSS3
- vanilla JavaScript + native ES modules
- Canvas / WebGL where required
- native Web Components
- Fetch API
- IndexedDB / local persistence where appropriate
- Service Worker + PWA manifest
- browser-native camera, microphone, speech and audio APIs

No React/Vite/Webpack/Babel frontend build is required for production.

## Persistent Mercury shell

The live shell has three sibling surfaces:

1. **HEADER**
2. **VIEWPORT**
3. **LIQUID DOCK**

Capability content manifests only inside VIEWPORT. The Liquid Dock remains anchored to the device floor and is not nested inside capability content.

Primary dock law:

`INTERWEB · AUGMENT · CODE · SCRIBE · OPTICS`

When a real optics stream is active, that same dock becomes:

`SEE · CAPTURE · ANALYZE · MACRO · EDITOR`

The root experience begins black, forms a live Mercury wake surface, responds to touch with a material ripple, and then reveals the persistent runtime. The boot surface is live code, not an MP4 pretending to be the interface.

## Intent-first runtime

The persistent shell accepts voice or typed intent and sends it through same-origin ARI `/api/*` routes. Jahorin interprets returned orchestration/render state and manifests the required capability without exposing provider selection to the user.

Voice handling is stateful and truthful: unsupported or denied microphone/speech APIs fall back to text instead of showing fake listening state.

`TAE, enter Demo Mode` activates the Demo Mode seam and presents:

`This is not an app. This is me.`

with GID `399152573423` and mode `PRIME ORCHESTRATOR`.

## Canonical capability registry

`static/repo-pages.json` remains the route/scene source of truth and preserves exactly **25 canonical capability pages**:

- Core: 5
- SYNCORI Augmented Audio: 10
- SYNCORI Augmented Optics: 10

The first five canonical SYNCORI audio instruments are live browser-audio instruments:

- LOOP
- KEYS
- DRUMS
- SAMPLE
- MIX

The other registered audio/optics scenes retain ARI-backed execution and can progressively gain deeper native instrumentation without changing the route registry.

## ARI contract

The browser calls same-origin `/api/*`; production hosting rewrites/proxies those requests to ARI.

Production ARI authority:

`https://ari-689058655022.us-west1.run.app`

Canonical routes include:

- `GET /api/health`
- `GET /api/ready`
- `GET|POST /api/identity`
- `POST|DELETE /api/identity/session`
- `GET|POST /api/render-state`
- `GET|POST /api/iot`
- `GET|POST /api/syncori`
- `GET|POST /api/tae`
- `POST /api/runtime`
- `POST /api/generate`

Provider secrets never belong in browser-delivered code.

## PWA

`static/manifest.json` defines the installable Jahorin Trismegistus app. `static/sw.js` caches the shell and capability routes but explicitly excludes `/api/*` and `/ws/*`, preventing cached intelligence responses from being presented as live ARI results.

## Deployment

- `vercel.json` is the canonical Vercel zero-build deployment contract.
- `netlify.toml` remains available for the Netlify zero-build target.
- `/api/*` rewrites must occur before persistent-shell navigation fallback.

## MA'AT release law

`.github/workflows/release-gate.yml` is the source release gate. It validates backend syntax, frontend JavaScript syntax, PWA identity, canonical 25-page topology, Jahorin shell contracts, browser-secret scanning, and the production container build.

A green source gate does **not** by itself prove real microphone/camera permission success, live provider execution, GID authentication, or deployed-domain behavior. Those must be verified against the deployed revision before declaring `PRODUCTION READY`.

Never report simulated connectivity as real connectivity, never expose provider credentials, never restore a sixth launcher to the canonical dock, and never replace live Mercury interaction with a static screenshot or decorative video.
