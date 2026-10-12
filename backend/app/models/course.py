
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import student_courses

if TYPE_CHECKING:
    from app.models.student import Student


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)

    students: Mapped[list["Student"]] = relationship(
        secondary=student_courses,
        back_populates="courses",
    )
