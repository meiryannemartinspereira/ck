
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ClassDay, ClassTime


class TeacherScheduleCreate(BaseModel):
    class_day: ClassDay
    class_time: ClassTime


class TeacherCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    room: str = Field(min_length=1, max_length=100)
    schedules: list[TeacherScheduleCreate] = Field(min_length=1)

    @field_validator("name", "room")
    @classmethod
    def validate_text_fields(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty")

        return value

    @field_validator("schedules")
    @classmethod
    def validate_schedules(
        cls,
        values: list[TeacherScheduleCreate],
    ) -> list[TeacherScheduleCreate]:
        schedules = [
            (schedule.class_day, schedule.class_time)
            for schedule in values
        ]

        if len(set(schedules)) != len(schedules):
            raise ValueError("Schedules cannot be duplicated")

        return values


class TeacherUpdate(TeacherCreate):
    pass


class TeacherResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    room: str | None
    schedules: list[TeacherScheduleCreate]
