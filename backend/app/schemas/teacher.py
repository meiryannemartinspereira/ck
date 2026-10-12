from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ClassDay, ClassTime


class TeacherScheduleCreate(BaseModel):
    class_day: ClassDay
    class_time: ClassTime


class TeacherCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    schedules: list[TeacherScheduleCreate] = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Teacher name cannot be empty")

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
    schedules: list[TeacherScheduleCreate]
