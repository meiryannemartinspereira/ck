import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.students import router as students_router
from app.routers.teachers import router as teachers_router
from app.routers.checklists import router as checklists_router


app = FastAPI(
    title="Código Kid API",
    description="API do sistema de checklist escolar.",
    version="0.1.0",
)

frontend_origin = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:8080",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        frontend_origin,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students_router)
app.include_router(teachers_router)
app.include_router(checklists_router)