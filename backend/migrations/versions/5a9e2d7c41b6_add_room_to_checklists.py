from alembic import op
import sqlalchemy as sa

revision = "5a9e2d7c41b6"
down_revision = "3c633cb8ab19"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "checklists",
        sa.Column("room", sa.String(length=100), nullable=True),
    )

    op.drop_constraint(
        "uq_checklist_date_schedule",
        "checklists",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_checklist_date_schedule_room",
        "checklists",
        ["date", "class_day", "class_time", "room"],
    )

    connection = op.get_bind()

    checklists = connection.execute(
        sa.text(
            """
            SELECT id, date, class_day, class_time, status
            FROM checklists
            WHERE room IS NULL
            """
        )
    ).mappings().all()

    for checklist in checklists:
        rooms = connection.execute(
            sa.text(
                """
                SELECT DISTINCT students.room
                FROM checklist_entries
                JOIN students ON students.id = checklist_entries.student_id
                WHERE checklist_entries.checklist_id = :checklist_id
                  AND students.room IS NOT NULL
                """
            ),
            {"checklist_id": checklist["id"]},
        ).scalars().all()

        for room in rooms:
            new_checklist_id = connection.execute(
                sa.text(
                    """
                    INSERT INTO checklists
                        (date, class_day, class_time, room, status, created_at, updated_at)
                    VALUES
                        (:date, :class_day, :class_time, :room, :status, NOW(), NOW())
                    RETURNING id
                    """
                ),
                {
                    "date": checklist["date"],
                    "class_day": checklist["class_day"],
                    "class_time": checklist["class_time"],
                    "room": room,
                    "status": checklist["status"],
                },
            ).scalar_one()

            connection.execute(
                sa.text(
                    """
                    UPDATE checklist_entries
                    SET checklist_id = :new_checklist_id
                    WHERE checklist_id = :old_checklist_id
                      AND student_id IN (
                          SELECT id
                          FROM students
                          WHERE room = :room
                      )
                    """
                ),
                {
                    "new_checklist_id": new_checklist_id,
                    "old_checklist_id": checklist["id"],
                    "room": room,
                },
            )


def downgrade() -> None:
    op.drop_constraint(
        "uq_checklist_date_schedule_room",
        "checklists",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_checklist_date_schedule",
        "checklists",
        ["date", "class_day", "class_time"],
    )

    op.drop_column("checklists", "room")
