from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.checklist import Checklist
from app.models.checklist_entry import ChecklistEntry
from app.models.student import Student
from app.models.enums import (
    ChecklistOverallStatus,
    ChecklistStatus,
    ClassDay,
    ClassTime,
)
from app.repositories.checklist_repository import (
    get_or_create_checklist_for_schedule,
)
from app.repositories.teacher_repository import get_teachers_for_schedule
from app.schemas.checklist import ChecklistEntryResponse, ChecklistResponse


def _to_response(session: Session, checklist: Checklist) -> ChecklistResponse:
    teachers = get_teachers_for_schedule(
        session=session,
        class_day=checklist.class_day,
        class_time=checklist.class_time,
        room=checklist.room,
    )

    entries = [
        ChecklistEntryResponse(
            id=entry.id,
            student_id=entry.student.id,
            student_name=entry.student.name,
            teachers=[teacher.name for teacher in teachers],
            course_names=[course.name for course in entry.student.courses],
            status=entry.status,
            observation=entry.observation,
        )
        for entry in checklist.entries
    ]

    return ChecklistResponse(
        id=checklist.id,
        class_day=checklist.class_day,
        class_time=checklist.class_time,
        room=checklist.room,
        status=checklist.status,
        date=checklist.date,
        entries=entries,
    )


def get_checklists_for_schedule(
    session: Session,
    class_day: ClassDay,
    class_time: ClassTime,
    room: str,
    checklist_date: date | None = None,
) -> list[ChecklistResponse]:
    selected_date = checklist_date or date.today()

    if selected_date == date.today():
        checklist = get_or_create_checklist_for_schedule(
            session=session,
            class_day=class_day,
            class_time=class_time,
            checklist_date=selected_date,
            room=room,
        )
    else:
        statement = (
            select(Checklist)
            .where(
                Checklist.date == selected_date,
                Checklist.class_day == class_day,
                Checklist.class_time == class_time,
                Checklist.room == room,
            )
            .options(
                selectinload(Checklist.entries)
                .selectinload(ChecklistEntry.student)
                .selectinload(Student.courses),
            )
        )
        checklist = session.scalar(statement)

    if checklist is None:
        return []

    return [_to_response(session, checklist)]


def update_checklist_observation(
    session: Session,
    checklist_id: int,
    observation: str,
) -> ChecklistResponse | None:
    statement = (
        select(ChecklistEntry)
        .where(ChecklistEntry.id == checklist_id)
        .options(
            selectinload(ChecklistEntry.checklist).selectinload(
                Checklist.entries
            ),
            selectinload(ChecklistEntry.student).selectinload(
                Student.courses
            ),
        )
    )

    entry = session.scalar(statement)

    if entry is None:
        return None

    checklist = entry.checklist

    if checklist.date != date.today():
        raise ValueError(
            "Checklists de datas passadas ou futuras não podem ser alterados."
        )

    entry.observation = observation.strip()
    entry.status = ChecklistStatus.PREENCHIDO

    all_entries_filled = bool(checklist.entries) and all(
        checklist_entry.status == ChecklistStatus.PREENCHIDO
        for checklist_entry in checklist.entries
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

    return _to_response(session, checklist)
