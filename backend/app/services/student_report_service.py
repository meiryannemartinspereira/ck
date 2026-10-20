
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.checklist import Checklist
from app.models.checklist_entry import ChecklistEntry
from app.models.student import Student


def get_student_checklist_history(
    session: Session,
    name: str,
) -> list[dict]:
    statement = (
        select(
            Student.id.label("student_id"),
            Student.name.label("student_name"),
            Checklist.id.label("checklist_id"),
            Checklist.date.label("checklist_date"),
            Checklist.class_day.label("class_day"),
            Checklist.class_time.label("class_time"),
            Checklist.status.label("checklist_status"),
            ChecklistEntry.id.label("entry_id"),
            ChecklistEntry.status.label("status"),
            ChecklistEntry.observation.label("observation"),
            ChecklistEntry.created_at.label("created_at"),
            ChecklistEntry.updated_at.label("updated_at"),
        )
        .join(
            ChecklistEntry,
            ChecklistEntry.student_id == Student.id,
        )
        .join(
            Checklist,
            Checklist.id == ChecklistEntry.checklist_id,
        )
        .where(
            func.lower(Student.name) == name.strip().lower()
        )
        .order_by(
            Checklist.date.desc(),
            Checklist.class_time,
        )
    )

    rows = session.execute(statement).mappings().all()

    return [dict(row) for row in rows]
