from typing import TYPE_CHECKING

from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin
from app.models.associations import enum_values
from app.models.enums import ChecklistStatus

if TYPE_CHECKING:
    from app.models.checklist import Checklist
    from app.models.student import Student


class ChecklistEntry(TimestampMixin, Base):
    __tablename__ = "checklist_entries"
    __table_args__ = (
        UniqueConstraint(
            "checklist_id",
            "student_id",
            name="uq_checklist_entry_student",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    checklist_id: Mapped[int] = mapped_column(
        ForeignKey("checklists.id", ondelete="CASCADE"),
        nullable=False,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )

    status: Mapped[ChecklistStatus] = mapped_column(
        SQLAlchemyEnum(
            ChecklistStatus,
            name="checklist_entry_status",
            values_callable=enum_values,
            native_enum=False,
        ),
        default=ChecklistStatus.PENDENTE,
        nullable=False,
    )

    observation: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )

    checklist: Mapped["Checklist"] = relationship(
        back_populates="entries",
    )

    student: Mapped["Student"] = relationship(
        back_populates="checklist_entries",
    )