from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.student import Student
from app.models.associations import StudentSchedule
from app.schemas.student import (
    StudentCreate,
    StudentResponse,
    StudentScheduleCreate,
)
from app.repositories.student_repository import (
    get_course_by_name,
    list_students,
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


def get_students(session: Session) -> list[StudentResponse]:
    return [
        _to_response(student)
        for student in list_students(session)
    ]