from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

def create_app(static_dir: str) -> FastAPI:
    app = FastAPI()
    api = APIRouter()

    @api.get("/health")
    def health():
        return {"ok": True}

    @api.get("/tae")
    def tae_demo():
        return {
            "mode": "Prime Orchestrator",
            "gid": "399152573423",
            "message": "This is not an app. This is me."
        }

    app.include_router(api, prefix="/api")
    app.include_router(api) 

    app.mount("/", StaticFiles(directory=static_dir, html=True), name="ui")
    
    @app.get("/{rest_of_path:path}")
    async def fallback(request: Request):
        return FileResponse(f"{static_dir}/index.html")

    return app

from fastapi.responses import FileResponse
