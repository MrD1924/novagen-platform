from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.experiment import Experiment, Sample
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentResponse,
    ExperimentUpdate,
    SampleCreate,
    SampleQCUpdate,
    SampleResponse,
)

import sys
sys.path.append("/app")
from shared.database import get_db  # noqa: E402
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload  # noqa: E402

router = APIRouter()


@router.post("/experiments", response_model=ExperimentResponse, status_code=201)
async def create_experiment(payload: ExperimentCreate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    exp = Experiment(**payload.model_dump())
    db.add(exp)
    await db.commit()
    await db.refresh(exp)
    return exp


@router.get("/experiments", response_model=list[ExperimentResponse])
async def list_experiments(project_id: UUID | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Experiment)
    if project_id:
        query = query.where(Experiment.project_id == project_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(experiment_id: UUID, payload: ExperimentUpdate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(404, "Experiment not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    await db.commit()
    await db.refresh(exp)
    return exp


@router.post("/samples", response_model=SampleResponse, status_code=201)
async def create_sample(payload: SampleCreate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    sample = Sample(**payload.model_dump())
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    return sample


@router.patch("/samples/{sample_id}/qc", response_model=SampleResponse)
async def record_qc(sample_id: UUID, payload: SampleQCUpdate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    result = await db.execute(select(Sample).where(Sample.id == sample_id))
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(404, "Sample not found")
    sample.status = payload.status
    sample.quality_control = payload.quality_control
    await db.commit()
    await db.refresh(sample)
    return sample


@router.get("/samples", response_model=list[SampleResponse])
async def list_samples(experiment_id: UUID | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Sample)
    if experiment_id:
        query = query.where(Sample.experiment_id == experiment_id)
    result = await db.execute(query)
    return result.scalars().all()
