from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.checklist import Checklist
from app.models.checklist_entry import ChecklistEntry
from app.models.enums import (
    ChecklistOverallStatus,
    ChecklistStatus,
    ClassDay,
    ClassTime,
)
from app.models.student import Student
from app.repositories.checklist_repository import (
    get_checklist_by_id,
    get_or_create_checklist_for_schedule,
)
from app.repositories.teacher_repository import get_teachers_for_schedule
from app.schemas.checklist import (
    ChecklistEntryResponse,
    ChecklistObservationUpdate,
    ChecklistResponse,
)


def _to_response(
    session: Session,
    checklist: Checklist,
) -> ChecklistResponse:
    teachers = get_teachers_for_schedule(
        session=session,
        class_day=checklist.class_day,
        class_time=checklist.class_time,
    )

    entries = [
        ChecklistEntryResponse(
            id=entry.id,
            student_id=entry.student.id,
            student_name=entry.student.name,
            teachers=[teacher.name for teacher in teachers],
            course_names=[
                course.name for course in entry.student.courses
            ],
            status=entry.status,
            observation=entry.observation,
        )
        for entry in checklist.entries
    ]

    return ChecklistResponse(
        id=checklist.id,
        class_day=checklist.class_day,
        class_time=checklist.class_time,
        status=checklist.status,
        date=checklist.date,
        entries=entries,
    )


def get_checklists_for_schedule(
    session: Session,
    class_day: ClassDay,
    class_time: ClassTime,
    checklist_date: date | None = None,
) -> list[ChecklistResponse]:
    checklist = get_or_create_checklist_for_schedule(
        session=session,
        class_day=class_day,
        class_time=class_time,
        checklist_date=checklist_date or date.today(),
    )

    if checklist is None:
        return []

    return [_to_response(session, checklist)]


def update_checklist_observation(
    session: Session,
    checklist_id: int,
    data: ChecklistObservationUpdate,
) -> ChecklistResponse | None:
    statement = (
        select(ChecklistEntry)
        .where(ChecklistEntry.id == checklist_id)
        .options(
            selectinload(ChecklistEntry.checklist)
            .selectinload(Checklist.entries)
            .selectinload(ChecklistEntry.student)
            .selectinload(Student.courses),
        )
    )

    entry = session.scalar(statement)

    if entry is None:
        return None

    checklist = entry.checklist
    entry.observation = data.observation.strip()
    entry.status = ChecklistStatus.PREENCHIDO

    all_entries_filled = bool(checklist.entries) and all(
        item.status == ChecklistStatus.PREENCHIDO
        for item in checklist.entries
    )

    checklist.status = (
        ChecklistOverallStatus.CONCLUIDO
        if all_entries_filled
        else ChecklistOverallStatus.EM_ANDAMENTO
    )

    try:
        session.commit()
        session.refresh(checklist)
        return _to_response(session, checklist)
    except Exception:
        session.rollback()
        raise
