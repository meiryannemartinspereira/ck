from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.enums import ClassDay, ClassTime
from app.schemas.checklist import (
    ChecklistObservationUpdate,
    ChecklistResponse,
)
from app.services.checklist_service import (
    get_checklists_for_schedule,
    update_checklist_observation,
)


router = APIRouter(prefix="/checklists", tags=["Checklists"])


@router.get("/", response_model=list[ChecklistResponse])
def list_checklists_endpoint(
    class_day: ClassDay,
    class_time: ClassTime,
    checklist_date: date | None = Query(default=None),
    session: Session = Depends(get_db),
) -> list[ChecklistResponse]:
    return get_checklists_for_schedule(
        session=session,
        class_day=class_day,
        class_time=class_time,
        checklist_date=checklist_date,
    )


@router.patch(
    "/entries/{entry_id}",
    response_model=ChecklistResponse,
)
def update_checklist_observation_endpoint(
    entry_id: int,
    data: ChecklistObservationUpdate,
    session: Session = Depends(get_db),
) -> ChecklistResponse:
    checklist = update_checklist_observation(
        session=session,
        checklist_id=entry_id,
        data=data,
    )

    if checklist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist entry not found",
        )

    return checklist
