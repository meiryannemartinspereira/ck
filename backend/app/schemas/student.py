from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ClassDay, ClassTime


class StudentScheduleCreate(BaseModel):
    class_day: ClassDay
    class_time: ClassTime


class StudentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    schedules: list[StudentScheduleCreate] = Field(min_length=1)
    course_names: list[str] = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Student name cannot be empty")

        return value

    @field_validator("course_names")
    @classmethod
    def validate_course_names(cls, values: list[str]) -> list[str]:
        normalized = [value.strip() for value in values]

        if any(not value for value in normalized):
            raise ValueError("Course names cannot be empty")

        if len({value.casefold() for value in normalized}) != len(normalized):
            raise ValueError("Course names cannot be duplicated")

        return normalized

    @field_validator("schedules")
    @classmethod
    def validate_schedules(
        cls,
        values: list[StudentScheduleCreate],
    ) -> list[StudentScheduleCreate]:
        schedules = [
            (schedule.class_day, schedule.class_time)
            for schedule in values
        ]

        if len(set(schedules)) != len(schedules):
            raise ValueError("Schedules cannot be duplicated")

        return values


class StudentUpdate(StudentCreate):
    pass


class StudentScheduleResponse(BaseModel):
    class_day: ClassDay
    class_time: ClassTime
    teachers: list[str]


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    schedules: list[StudentScheduleResponse]
    course_names: list[str]
