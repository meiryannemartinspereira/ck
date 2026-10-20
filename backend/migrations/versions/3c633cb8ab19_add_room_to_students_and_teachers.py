from alembic import op
import sqlalchemy as sa


revision = "3c633cb8ab19"
down_revision = "d742c8df750a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "students",
        sa.Column("room", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "teachers",
        sa.Column("room", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("teachers", "room")
    op.drop_column("students", "room")
