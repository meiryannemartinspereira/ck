from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
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
    room: str = Query(min_length=1, max_length=100),
    checklist_date: date | None = Query(default=None),
    session: Session = Depends(get_db),
):
    return get_checklists_for_schedule(
        session=session,
        class_day=class_day,
        class_time=class_time,
        room=room.strip(),
        checklist_date=checklist_date,
    )


@router.patch("/entries/{entry_id}", response_model=ChecklistResponse)
def update_checklist_observation_endpoint(
    entry_id: int,
    data: ChecklistObservationUpdate,
    session: Session = Depends(get_db),
):
    try:
        result = update_checklist_observation(
            session=session,
            checklist_id=entry_id,
            observation=data.observation,
        )
    except ValueError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Entrada de checklist não encontrada.",
        )

    return result
