from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.teacher import TeacherCreate, TeacherResponse, TeacherUpdate
from app.services.teacher_service import (
    create_teacher,
    get_teachers,
    remove_teacher,
    update_teacher,
)


router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.post(
    "/",
    response_model=TeacherResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_teacher_endpoint(
    data: TeacherCreate,
    session: Session = Depends(get_db),
) -> TeacherResponse:
    return create_teacher(session, data)


@router.get("/")
def list_teachers_endpoint(
    name: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    session: Session = Depends(get_db),
) -> dict:
    return get_teachers(
        session=session,
        name=name,
        page=page,
        page_size=page_size,
    )


@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher_endpoint(
    teacher_id: int,
    data: TeacherUpdate,
    session: Session = Depends(get_db),
) -> TeacherResponse:
    teacher = update_teacher(session, teacher_id, data)

    if teacher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher_endpoint(
    teacher_id: int,
    session: Session = Depends(get_db),
) -> Response:
    deleted = remove_teacher(session, teacher_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
