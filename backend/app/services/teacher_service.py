
from sqlalchemy.orm import Session

from app.models.associations import TeacherSchedule
from app.models.teacher import Teacher
from app.repositories.teacher_repository import (
    delete_teacher,
    get_teacher_by_id,
    list_teachers,
)
from app.schemas.teacher import (
    TeacherCreate,
    TeacherResponse,
    TeacherScheduleCreate,
    TeacherUpdate,
)


def _to_response(teacher: Teacher) -> TeacherResponse:
    return TeacherResponse(
        id=teacher.id,
        name=teacher.name,
        room=teacher.room,
        schedules=[
            TeacherScheduleCreate(
                class_day=schedule.class_day,
                class_time=schedule.class_time,
            )
            for schedule in teacher.schedules
        ],
    )


def create_teacher(
    session: Session,
    data: TeacherCreate,
) -> TeacherResponse:
    teacher = Teacher(
        name=data.name,
        room=data.room,
    )
    teacher.schedules = [
        TeacherSchedule(
            class_day=schedule.class_day,
            class_time=schedule.class_time,
        )
        for schedule in data.schedules
    ]

    session.add(teacher)

    try:
        session.commit()
        session.refresh(teacher)
        return _to_response(teacher)
    except Exception:
        session.rollback()
        raise


def get_teachers(
    session: Session,
    name: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    teachers, total = list_teachers(
        session=session,
        name=name,
        page=page,
        page_size=page_size,
    )

    return {
        "items": [_to_response(teacher) for teacher in teachers],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_teacher(
    session: Session,
    teacher_id: int,
    data: TeacherUpdate,
) -> TeacherResponse | None:
    teacher = get_teacher_by_id(session, teacher_id)

    if teacher is None:
        return None

    teacher.name = data.name
    teacher.room = data.room
    teacher.schedules.clear()
    teacher.schedules.extend(
        TeacherSchedule(
            class_day=schedule.class_day,
            class_time=schedule.class_time,
        )
        for schedule in data.schedules
    )

    try:
        session.commit()
        session.refresh(teacher)
        return _to_response(teacher)
    except Exception:
        session.rollback()
        raise


def remove_teacher(session: Session, teacher_id: int) -> bool:
    teacher = get_teacher_by_id(session, teacher_id)

    if teacher is None:
        return False

    try:
        delete_teacher(session, teacher)
        return True
    except Exception:
        session.rollback()
        raise
