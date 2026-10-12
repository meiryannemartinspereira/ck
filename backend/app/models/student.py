
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin
from app.models.associations import StudentSchedule, student_courses

if TYPE_CHECKING:
    from app.models.checklist import Checklist
    from app.models.course import Course


class Student(TimestampMixin, Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)

    schedules: Mapped[list[StudentSchedule]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan",
    )
    courses: Mapped[list["Course"]] = relationship(
        secondary=student_courses,
        back_populates="students",
    )
    checklists: Mapped[list["Checklist"]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan",
    )
