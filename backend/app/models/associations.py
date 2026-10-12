
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ClassDay, ClassTime

if TYPE_CHECKING:
    from app.models.student import Student
    from app.models.teacher import Teacher


def enum_values(enum_class):
    return [item.value for item in enum_class]


student_courses = Table(
    "student_courses",
    Base.metadata,
    Column(
        "student_id",
        ForeignKey("students.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "course_id",
        ForeignKey("courses.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class StudentSchedule(Base):
    __tablename__ = "student_schedules"

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        primary_key=True,
    )
    class_day: Mapped[ClassDay] = mapped_column(
        SQLAlchemyEnum(
            ClassDay,
            name="class_day",
            values_callable=enum_values,
            native_enum=False,
        ),
        primary_key=True,
    )
    class_time: Mapped[ClassTime] = mapped_column(
        SQLAlchemyEnum(
            ClassTime,
            name="class_time",
            values_callable=enum_values,
            native_enum=False,
        ),
        primary_key=True,
    )

    student: Mapped["Student"] = relationship(back_populates="schedules")


class TeacherSchedule(Base):
    __tablename__ = "teacher_schedules"

    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("teachers.id", ondelete="CASCADE"),
        primary_key=True,
    )
    class_day: Mapped[ClassDay] = mapped_column(
        SQLAlchemyEnum(
            ClassDay,
            name="class_day",
            values_callable=enum_values,
            native_enum=False,
        ),
        primary_key=True,
    )
    class_time: Mapped[ClassTime] = mapped_column(
        SQLAlchemyEnum(
            ClassTime,
            name="class_time",
            values_callable=enum_values,
            native_enum=False,
        ),
        primary_key=True,
    )

    teacher: Mapped["Teacher"] = relationship(back_populates="schedules")
