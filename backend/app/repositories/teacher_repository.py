from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.associations import TeacherSchedule
from app.models.enums import ClassDay, ClassTime
from app.models.teacher import Teacher


def get_teacher_by_id(
    session: Session,
    teacher_id: int,
) -> Teacher | None:
    statement = (
        select(Teacher)
        .options(selectinload(Teacher.schedules))
        .where(Teacher.id == teacher_id)
    )

    return session.scalar(statement)


def list_teachers(
    session: Session,
    name: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Teacher], int]:
    statement = select(Teacher).options(selectinload(Teacher.schedules))
    count_statement = select(func.count(Teacher.id))

    if name:
        name_filter = Teacher.name.ilike(f"%{name.strip()}%")
        statement = statement.where(name_filter)
        count_statement = count_statement.where(name_filter)

    total = session.scalar(count_statement) or 0

    statement = (
        statement
        .order_by(Teacher.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    teachers = list(session.scalars(statement).all())

    return teachers, total


def get_teachers_for_schedule(
    session: Session,
    class_day: ClassDay,
    class_time: ClassTime,
    room: str | None = None,
) -> list[Teacher]:
    statement = (
        select(Teacher)
        .join(
            TeacherSchedule,
            TeacherSchedule.teacher_id == Teacher.id,
        )
        .where(
            TeacherSchedule.class_day == class_day,
            TeacherSchedule.class_time == class_time,
        )
    )

    if room is not None:
        statement = statement.where(Teacher.room == room)

    statement = statement.order_by(Teacher.name)

    return list(session.scalars(statement).unique().all())


def delete_teacher(session: Session, teacher: Teacher) -> None:
    session.delete(teacher)
    session.commit()
