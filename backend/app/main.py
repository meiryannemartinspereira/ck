from fastapi import FastAPI

from app.routers.students import router as students_router
from app.routers.teachers import router as teachers_router


app = FastAPI(
    title="Código Kid API",
    description="API do sistema de checklist escolar.",
    version="0.1.0",
)

app.include_router(students_router)
app.include_router(teachers_router)
