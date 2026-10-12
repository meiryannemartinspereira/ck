from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course
from app.models.student import Student


def get_course_by_name(session: Session, name: str) -> Course | None:
    statement = select(Course).where(
        func.lower(Course.name) == name.lower()
    )
    return session.scalar(statement)


def get_student_by_id(
    session: Session,
    student_id: int,
) -> Student | None:
    statement = (
        select(Student)
        .options(
            selectinload(Student.schedules),
            selectinload(Student.courses),
        )
        .where(Student.id == student_id)
    )
    return session.scalar(statement)


def list_students(
    session: Session,
    name: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Student], int]:
    statement = select(Student).options(
        selectinload(Student.schedules),
        selectinload(Student.courses),
    )

    count_statement = select(func.count(Student.id))

    if name:
        name_filter = Student.name.ilike(f"%{name.strip()}%")
        statement = statement.where(name_filter)
        count_statement = count_statement.where(name_filter)

    total = session.scalar(count_statement) or 0

    statement = (
        statement
        .order_by(Student.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    students = list(session.scalars(statement).all())

    return students, total


def delete_student(
    session: Session,
    student: Student,
) -> None:
    session.delete(student)
    session.commit()
