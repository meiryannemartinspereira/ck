
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin
from app.models.associations import TeacherSchedule


class Teacher(TimestampMixin, Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    room: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    schedules: Mapped[list[TeacherSchedule]] = relationship(
        back_populates="teacher",
        cascade="all, delete-orphan",
    )
