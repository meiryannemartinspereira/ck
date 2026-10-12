from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.services.student_service import (
    create_student,
    get_students,
    remove_student,
    update_student,
)


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


@router.get("/")
def list_students_endpoint(
    name: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    session: Session = Depends(get_db),
) -> dict:
    return get_students(
        session=session,
        name=name,
        page=page,
        page_size=page_size,
    )


@router.put("/{student_id}", response_model=StudentResponse)
def update_student_endpoint(
    student_id: int,
    data: StudentUpdate,
    session: Session = Depends(get_db),
) -> StudentResponse:
    student = update_student(session, student_id, data)

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return student


@router.delete(
    "/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_student_endpoint(
    student_id: int,
    session: Session = Depends(get_db),
) -> Response:
    deleted = remove_student(session, student_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
