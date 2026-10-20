from datetime import date

from pydantic import BaseModel

from app.models.enums import (
    ChecklistOverallStatus,
    ChecklistStatus,
    ClassDay,
    ClassTime,
)


class ChecklistObservationUpdate(BaseModel):
    observation: str


class ChecklistEntryResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    teachers: list[str]
    course_names: list[str]
    status: ChecklistStatus
    observation: str


class ChecklistResponse(BaseModel):
    id: int
    class_day: ClassDay
    class_time: ClassTime
    room: str | None
    status: ChecklistOverallStatus
    date: date
    entries: list[ChecklistEntryResponse]
