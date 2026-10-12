from sqlalchemy.orm import Session

from app.models.associations import StudentSchedule
from app.models.course import Course
from app.models.student import Student
from app.repositories.student_repository import (
    delete_student,
    get_course_by_name,
    get_student_by_id,
    list_students,
)
from app.schemas.student import (
    StudentCreate,
    StudentResponse,
    StudentScheduleCreate,
    StudentUpdate,
)


def _to_response(student: Student) -> StudentResponse:
    return StudentResponse(
        id=student.id,
        name=student.name,
        schedules=[
            StudentScheduleCreate(
                class_day=schedule.class_day,
                class_time=schedule.class_time,
            )
            for schedule in student.schedules
        ],
        course_names=[course.name for course in student.courses],
    )


def create_student(
    session: Session,
    data: StudentCreate,
) -> StudentResponse:
    student = Student(name=data.name)

    student.schedules = [
        StudentSchedule(
            class_day=schedule.class_day,
            class_time=schedule.class_time,
        )
        for schedule in data.schedules
    ]

    for course_name in data.course_names:
        course = get_course_by_name(session, course_name)

        if course is None:
            course = Course(name=course_name)

        student.courses.append(course)

    session.add(student)

    try:
        session.commit()
        session.refresh(student)
        return _to_response(student)
    except Exception:
        session.rollback()
        raise


def get_students(
    session: Session,
    name: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    students, total = list_students(
        session=session,
        name=name,
        page=page,
        page_size=page_size,
    )

    return {
        "items": [_to_response(student) for student in students],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_student(
    session: Session,
    student_id: int,
    data: StudentUpdate,
) -> StudentResponse | None:
    student = get_student_by_id(session, student_id)

    if student is None:
        return None

    student.name = data.name

    student.schedules.clear()
    student.schedules.extend(
        StudentSchedule(
            class_day=schedule.class_day,
            class_time=schedule.class_time,
        )
        for schedule in data.schedules
    )

    courses = []

    for course_name in data.course_names:
        course = get_course_by_name(session, course_name)

        if course is None:
            course = Course(name=course_name)

        courses.append(course)

    student.courses = courses

    try:
        session.commit()
        session.refresh(student)
        return _to_response(student)
    except Exception:
        session.rollback()
        raise


def remove_student(
    session: Session,
    student_id: int,
) -> bool:
    student = get_student_by_id(session, student_id)

    if student is None:
        return False

    try:
        delete_student(session, student)
        return True
    except Exception:
        session.rollback()
        raise
