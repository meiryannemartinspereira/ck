from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course
from app.models.student import Student


def get_course_by_name(session: Session, name: str) -> Course | None:
    statement = select(Course).where(func.lower(Course.name) == name.lower())
    return session.scalar(statement)


def get_student_by_id(session: Session, student_id: int) -> Student | None:
    statement = (
        select(Student)
        .options(
            selectinload(Student.schedules),
            selectinload(Student.courses),
        )
        .where(Student.id == student_id)
    )
    return session.scalar(statement)


def list_students(session: Session) -> list[Student]:
    statement = (
        select(Student)
        .options(
            selectinload(Student.schedules),
            selectinload(Student.courses),
        )
        .order_by(Student.name)
    )
    return list(session.scalars(statement).all())