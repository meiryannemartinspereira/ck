from datetime import date as DateType
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum as SQLAlchemyEnum
from sqlalchemy import Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin
from app.models.associations import enum_values
from app.models.enums import (
    ChecklistOverallStatus,
    ClassDay,
    ClassTime,
)

if TYPE_CHECKING:
    from app.models.checklist_entry import ChecklistEntry


class Checklist(TimestampMixin, Base):
    __tablename__ = "checklists"
    __table_args__ = (
        UniqueConstraint(
            "date",
            "class_day",
            "class_time",
            name="uq_checklist_date_schedule",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    date: Mapped[DateType] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

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

    status: Mapped[ChecklistOverallStatus] = mapped_column(
        SQLAlchemyEnum(
            ChecklistOverallStatus,
            name="checklist_overall_status",
            values_callable=enum_values,
            native_enum=False,
        ),
        default=ChecklistOverallStatus.EM_ANDAMENTO,
        nullable=False,
    )

    entries: Mapped[list["ChecklistEntry"]] = relationship(
        back_populates="checklist",
        cascade="all, delete-orphan",
    )