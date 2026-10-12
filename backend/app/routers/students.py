from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.student import StudentCreate, StudentResponse
from app.services.student_service import create_student, get_students


router = APIRouter(prefix="/students", tags=["Students"])


@router.post(
    "/",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student_endpoint(
    data: StudentCreate,
    session: Session = Depends(get_db),
) -> StudentResponse:
    return create_student(session, data)


@router.get(
    "/",
    response_model=list[StudentResponse],
)
def list_students_endpoint(
    session: Session = Depends(get_db),
) -> list[StudentResponse]:
    return get_students(session)
