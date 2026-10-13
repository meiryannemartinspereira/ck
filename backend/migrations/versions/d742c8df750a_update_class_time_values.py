"""update class time values

Revision ID: d742c8df750a
Revises: 0c030bf37752
Create Date: 2026-10-13 14:24:48.168016

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d742c8df750a"
down_revision: Union[str, Sequence[str], None] = "0c030bf37752"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()

    for table in ("checklists", "student_schedules", "teacher_schedules"):
        op.alter_column(
            table,
            "class_time",
            existing_type=sa.VARCHAR(length=5),
            type_=sa.VARCHAR(length=11),
            existing_nullable=False,
        )

        connection.execute(
            sa.text(
                f"""
                UPDATE {table}
                SET class_time = CASE
                    WHEN class_time = '13:30' THEN '13:30-15:30'
                    WHEN class_time = '17:30' THEN '15:30-17:30'
                    ELSE class_time
                END
                WHERE class_time IN ('13:30', '17:30')
                """
            )
        )

    op.alter_column(
        "checklists",
        "status",
        existing_type=sa.VARCHAR(length=20),
        type_=sa.VARCHAR(length=12),
        existing_nullable=False,
        existing_server_default=sa.text("'EM_ANDAMENTO'::character varying"),
    )


def downgrade() -> None:
    connection = op.get_bind()

    for table in ("checklists", "student_schedules", "teacher_schedules"):
        connection.execute(
            sa.text(
                f"""
                UPDATE {table}
                SET class_time = CASE
                    WHEN class_time = '13:30-15:30' THEN '13:30'
                    WHEN class_time = '15:30-17:30' THEN '17:30'
                    ELSE class_time
                END
                WHERE class_time IN ('13:30-15:30', '15:30-17:30')
                """
            )
        )

        op.alter_column(
            table,
            "class_time",
            existing_type=sa.VARCHAR(length=11),
            type_=sa.VARCHAR(length=5),
            existing_nullable=False,
        )

    op.alter_column(
        "checklists",
        "status",
        existing_type=sa.VARCHAR(length=12),
        type_=sa.VARCHAR(length=20),
        existing_nullable=False,
        existing_server_default=sa.text("'EM_ANDAMENTO'::character varying"),
    )