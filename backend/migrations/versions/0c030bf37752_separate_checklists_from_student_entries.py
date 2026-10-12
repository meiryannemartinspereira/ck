"""Separate checklists from student entries.

Revision ID: 0c030bf37752
Revises: 144736851fb2
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0c030bf37752"
down_revision: Union[str, Sequence[str], None] = "144736851fb2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            CREATE TEMPORARY TABLE old_checklist_entries AS
            SELECT
                id,
                student_id,
                date,
                class_day,
                class_time,
                status,
                observation,
                created_at,
                updated_at
            FROM checklists
            """
        )
    )

    op.add_column(
        "checklists",
        sa.Column(
            "overall_status",
            sa.String(length=20),
            nullable=False,
            server_default="EM_ANDAMENTO",
        ),
    )

    connection.execute(
        sa.text(
            """
            UPDATE checklists AS checklist
            SET overall_status = CASE
                WHEN NOT EXISTS (
                    SELECT 1
                    FROM old_checklist_entries AS entry
                    WHERE entry.date = checklist.date
                      AND entry.class_day = checklist.class_day
                      AND entry.class_time = checklist.class_time
                      AND entry.status != 'PREENCHIDO'
                )
                THEN 'CONCLUIDO'
                ELSE 'EM_ANDAMENTO'
            END
            """
        )
    )

    op.create_table(
        "checklist_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("checklist_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=10),
            nullable=False,
            server_default="PENDENTE",
        ),
        sa.Column(
            "observation",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["checklist_id"],
            ["checklists.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["students.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "checklist_id",
            "student_id",
            name="uq_checklist_entry_student",
        ),
    )

    connection.execute(
        sa.text(
            """
            DELETE FROM checklists AS duplicate
            USING checklists AS keeper
            WHERE duplicate.date = keeper.date
              AND duplicate.class_day = keeper.class_day
              AND duplicate.class_time = keeper.class_time
              AND duplicate.id > keeper.id
            """
        )
    )

    connection.execute(
        sa.text(
            """
            INSERT INTO checklist_entries (
                checklist_id,
                student_id,
                status,
                observation,
                created_at,
                updated_at
            )
            SELECT
                checklist.id,
                entry.student_id,
                entry.status,
                COALESCE(entry.observation, ''),
                entry.created_at,
                entry.updated_at
            FROM old_checklist_entries AS entry
            JOIN checklists AS checklist
              ON checklist.date = entry.date
             AND checklist.class_day = entry.class_day
             AND checklist.class_time = entry.class_time
            """
        )
    )

    op.drop_constraint(
        "uq_checklist_student_date_schedule",
        "checklists",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_checklist_date_schedule",
        "checklists",
        ["date", "class_day", "class_time"],
    )

    op.drop_constraint(
        "checklists_student_id_fkey",
        "checklists",
        type_="foreignkey",
    )

    op.drop_column("checklists", "student_id")
    op.drop_column("checklists", "observation")
    op.drop_column("checklists", "status")

    op.alter_column(
        "checklists",
        "overall_status",
        new_column_name="status",
        existing_type=sa.String(length=20),
        existing_nullable=False,
        existing_server_default="EM_ANDAMENTO",
    )


def downgrade() -> None:
    raise NotImplementedError(
        "This migration cannot be safely reversed automatically."
    )
