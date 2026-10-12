from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.associations import StudentSchedule
from app.models.checklist import Checklist
from app.models.checklist_entry import ChecklistEntry
from app.models.enums import (
    ChecklistOverallStatus,
    ChecklistStatus,
    ClassDay,
    ClassTime,
)
from app.models.student import Student


def get_or_create_checklist_for_schedule(
    session: Session,
    class_day: ClassDay,
    class_time: ClassTime,
    checklist_date: date,
) -> Checklist | None:
    students_statement = (
        select(Student)
        .join(StudentSchedule, StudentSchedule.student_id == Student.id)
        .where(
            StudentSchedule.class_day == class_day,
            StudentSchedule.class_time == class_time,
        )
        .options(selectinload(Student.courses))
        .order_by(Student.name)
    )

    students = list(session.scalars(students_statement).all())

    if not students:
        return None

    checklist_statement = (
        select(Checklist)
        .where(
            Checklist.date == checklist_date,
            Checklist.class_day == class_day,
            Checklist.class_time == class_time,
        )
        .options(
            selectinload(Checklist.entries)
            .selectinload(ChecklistEntry.student)
            .selectinload(Student.courses),
        )
    )

    checklist = session.scalar(checklist_statement)

    if checklist is None:
        checklist = Checklist(
            date=checklist_date,
            class_day=class_day,
            class_time=class_time,
        )
        session.add(checklist)
        session.flush()

    existing_student_ids = {
        entry.student_id for entry in checklist.entries
    }

    for student in students:
        if student.id not in existing_student_ids:
            checklist.entries.append(
                ChecklistEntry(student_id=student.id)
            )

    all_entries_filled = bool(checklist.entries) and all(
        entry.status == ChecklistStatus.PREENCHIDO
        for entry in checklist.entries
    )

    checklist.status = (
        ChecklistOverallStatus.CONCLUIDO
        if all_entries_filled
        else ChecklistOverallStatus.EM_ANDAMENTO
    )

    try:
        session.commit()
        session.refresh(checklist)
    except Exception:
        session.rollback()
        raise

    return session.scalar(checklist_statement)


def get_checklist_by_id(
    session: Session,
    checklist_id: int,
) -> Checklist | None:
    statement = (
        select(Checklist)
        .where(Checklist.id == checklist_id)
        .options(
            selectinload(Checklist.entries)
            .selectinload(ChecklistEntry.student)
            .selectinload(Student.courses),
        )
    )

    return session.scalar(statement)
