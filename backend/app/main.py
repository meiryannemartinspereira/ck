from fastapi import FastAPI

from app.routers.students import router as students_router


app = FastAPI(
    title="Código Kid API",
    description="API do sistema de checklist escolar.",
    version="0.1.0",
)

app.include_router(students_router)
