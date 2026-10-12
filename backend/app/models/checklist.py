
from datetime import date as DateType, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum as SQLAlchemyEnum
from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin
from app.models.associations import enum_values
from app.models.enums import ChecklistStatus, ClassDay, ClassTime

if TYPE_CHECKING:
    from app.models.student import Student


class Checklist(TimestampMixin, Base):
    __tablename__ = "checklists"
    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "date",
            "class_day",
            "class_time",
            name="uq_checklist_student_date_schedule",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[DateType] = mapped_column(Date, nullable=False, index=True)
    class_day: Mapped[ClassDay] = mapped_column(
        SQLAlchemyEnum(
            ClassDay,
            name="checklist_class_day",
            values_callable=enum_values,
            native_enum=False,
        ),
        nullable=False,
    )
    class_time: Mapped[ClassTime] = mapped_column(
        SQLAlchemyEnum(
            ClassTime,
            name="checklist_class_time",
            values_callable=enum_values,
            native_enum=False,
        ),
        nullable=False,
    )
    status: Mapped[ChecklistStatus] = mapped_column(
        SQLAlchemyEnum(
            ChecklistStatus,
            name="checklist_status",
            values_callable=enum_values,
            native_enum=False,
        ),
        default=ChecklistStatus.PENDENTE,
        server_default=ChecklistStatus.PENDENTE.value,
        nullable=False,
    )
    observation: Mapped[str | None] = mapped_column(Text, nullable=True)

    student: Mapped["Student"] = relationship(back_populates="checklists")
