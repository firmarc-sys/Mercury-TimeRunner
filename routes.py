import os
import time
import uuid
from typing import Any

import httpx
from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

OWNER_GID = "399152573423"
OWNER_MODE = "Prime Orchestrator"
DEMO_PHRASE = "TAE, enter Demo Mode"
CANONICAL_LINE = "This is not an app. This is me."


class RuntimeEnvelope(BaseModel):
    gid: str | None = None
    intent: str = ""
    capability: str = "text"
    module: str = "mercury"
    payload: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)
    request_id: str | None = None
    timestamp: str | None = None


class TaeRequest(BaseModel):
    op: str | None = None
    prompt: str = ""
    gid: str | None = None
    request_id: str | None = None


def _request_id(value: str | None = None) -> str:
    return value or str(uuid.uuid4())


def _gemini_key() -> str | None:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("Gemini")


def _gemini_model() -> str:
    return os.getenv("GEMINI_DEFAULT_MODEL", "gemini-3.6-flash")


def _provider_configured() -> bool:
    return bool(_gemini_key())


def _render_state(state: str = "idle") -> dict[str, Any]:
    return {
        "ok": True,
        "runtime": "Mercury",
        "state": state,
        "alive": True,
        "gid": OWNER_GID,
        "mode": OWNER_MODE,
        "timestamp_ms": int(time.time() * 1000),
    }


async def _generate_text(prompt: str, request_id: str) -> dict[str, Any]:
    key = _gemini_key()
    if not key:
        raise HTTPException(status_code=503, detail="Google provider is not configured")

    model = _gemini_model()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7},
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, params={"key": key}, json=body)
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Google provider timed out") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Google provider unavailable") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Google provider returned HTTP {response.status_code}")

    data = response.json()
    candidates = data.get("candidates") or []
    parts = (((candidates[0] if candidates else {}).get("content") or {}).get("parts") or [])
    text = "".join(part.get("text", "") for part in parts if isinstance(part, dict)).strip()
    if not text:
        raise HTTPException(status_code=502, detail="Google provider returned no text")

    usage = data.get("usageMetadata") or {}
    return {
        "text": text,
        "model": model,
        "request_id": request_id,
        "tokens": usage.get("totalTokenCount"),
    }


def create_app(static_dir: str) -> FastAPI:
    app = FastAPI(title="ARI — Jahorin Mercury Runtime", version="1.0.0")
    api = APIRouter()

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = request.headers.get("x-request-id") or str(uuid.uuid4())
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # FastAPI's exception handlers normalize the body; never emit secrets here.
            raise
        response.headers["x-request-id"] = rid
        response.headers["x-runtime"] = "ARI"
        response.headers["cache-control"] = "no-store" if request.url.path.startswith("/api/") else response.headers.get("cache-control", "public, max-age=300")
        response.headers["x-response-time-ms"] = str(round((time.perf_counter() - started) * 1000, 2))
        return response

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "ok": False,
                "error": str(exc.detail),
                "request_id": request.headers.get("x-request-id"),
            },
        )

    @api.get("/health")
    async def health():
        return {"ok": True, "service": "ARI", "runtime": "Mercury"}

    @api.get("/ready")
    async def ready():
        configured = _provider_configured()
        body = {
            "ok": configured,
            "service": "ARI",
            "provider": "google-gemini",
            "provider_configured": configured,
            "model": _gemini_model(),
        }
        return JSONResponse(status_code=200 if configured else 503, content=body)

    @api.get("/identity")
    async def identity():
        # Display identity is intentionally not equivalent to authentication.
        return {
            "ok": True,
            "gid": OWNER_GID,
            "mode": OWNER_MODE,
            "authenticated": False,
            "identity_scope": "display",
        }

    @api.get("/render-state")
    async def get_render_state():
        return _render_state()

    @api.post("/render-state")
    async def post_render_state(payload: dict[str, Any]):
        return _render_state(str(payload.get("state") or "active"))

    @api.get("/iot")
    async def get_iot():
        return {"ok": True, "capability": "iot", "status": "online", "devices": []}

    @api.post("/iot")
    async def post_iot(payload: dict[str, Any]):
        return {"ok": True, "capability": "iot", "accepted": True, "payload": payload}

    @api.get("/syncori")
    async def get_syncori():
        return {"ok": True, "capability": "syncori", "status": "online", "engine": "SYNCORI Infinite Audio"}

    @api.post("/syncori")
    async def post_syncori(payload: dict[str, Any]):
        return {"ok": True, "capability": "syncori", "accepted": True, "state": payload}

    @api.get("/tae")
    async def tae_status():
        return {
            "ok": True,
            "engine": "TAE",
            "mode": OWNER_MODE,
            "gid": OWNER_GID,
            "activation": DEMO_PHRASE,
        }

    @api.post("/tae")
    async def tae_execute(req: TaeRequest):
        rid = _request_id(req.request_id)
        prompt = req.prompt.strip()
        normalized = prompt.rstrip(".").casefold()
        if normalized == DEMO_PHRASE.casefold():
            return {
                "ok": True,
                "request_id": rid,
                "demo": True,
                "gid": OWNER_GID,
                "mode": OWNER_MODE,
                "message": CANONICAL_LINE,
                "render_state": _render_state("generate"),
                "reply": {"kind": "prose", "text": CANONICAL_LINE, "tokens": 0},
            }
        if not prompt:
            raise HTTPException(status_code=422, detail="prompt is required")
        result = await _generate_text(prompt, rid)
        return {
            "ok": True,
            "request_id": rid,
            "gid": OWNER_GID,
            "mode": OWNER_MODE,
            "reply": {"kind": "prose", "text": result["text"], "tokens": result.get("tokens")},
            "provider": {"name": "google-gemini", "model": result["model"]},
        }

    @api.post("/runtime")
    async def runtime(req: RuntimeEnvelope):
        rid = _request_id(req.request_id)
        capability = req.capability.strip().lower()
        intent = req.intent.strip() or str(req.payload.get("prompt") or "").strip()

        if capability in {"render", "render-state", "state"}:
            return {"ok": True, "request_id": rid, "result": _render_state("active")}
        if capability == "identity":
            return {"ok": True, "request_id": rid, "result": {"gid": OWNER_GID, "mode": OWNER_MODE, "authenticated": False}}
        if capability == "syncori":
            return {"ok": True, "request_id": rid, "result": {"status": "online", "engine": "SYNCORI Infinite Audio"}}
        if capability == "iot":
            return {"ok": True, "request_id": rid, "result": {"status": "online", "devices": []}}
        if capability in {"tae", "demo"} and intent.rstrip(".").casefold() == DEMO_PHRASE.casefold():
            return {
                "ok": True,
                "request_id": rid,
                "result": {
                    "demo": True,
                    "gid": OWNER_GID,
                    "mode": OWNER_MODE,
                    "message": CANONICAL_LINE,
                    "render_state": _render_state("generate"),
                },
            }
        if capability in {"text", "reasoning", "code", "documents", "scribe", "interweb", "vision", "multimodal", "tae"}:
            if not intent:
                raise HTTPException(status_code=422, detail="intent or payload.prompt is required")
            result = await _generate_text(intent, rid)
            return {
                "ok": True,
                "request_id": rid,
                "result": result,
                "provider": {"name": "google-gemini", "model": result["model"]},
            }
        raise HTTPException(status_code=400, detail=f"Unsupported capability: {capability}")

    app.include_router(api, prefix="/api")
    # Preserve legacy aliases used by earlier clients.
    app.include_router(api)

    app.mount("/", StaticFiles(directory=static_dir, html=True), name="ui")

    @app.get("/{rest_of_path:path}", include_in_schema=False)
    async def fallback(rest_of_path: str):
        return FileResponse(f"{static_dir}/index.html")

    return app
