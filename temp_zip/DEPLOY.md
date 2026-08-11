# JAHORIN Mercury (v1) — Cloud Run deployment

From Google Cloud Shell:

    # 1. Upload this zip via Cloud Shell (three-dot menu -> Upload), then:
    unzip jai-mercury-v1-cloudrun.zip -d jai-mercury-v1
    cd jai-mercury-v1

    # 2. Point at your project
    gcloud config set project project-7e6f2720-0291-4c91-8c3

    # 3. Deploy (Dockerfile is picked up automatically)
    gcloud run deploy jai-mercury-v1 \
      --source . \
      --region us-west1 \
      --allow-unauthenticated

Cloud Run prints the public HTTPS URL when it finishes.
Notes:
- The server reads PORT from the environment (Cloud Run injects it).
- Local test: npm install && npm run build && cp -r public/assets public/fonts dist/ && node server.cjs
- API stubs live in server.cjs (/api/tae, /api/render-state, /api/identity, /api/iot, /api/syncori).
  Replace them there when the real backend is ready; the frontend contract is already wired.
