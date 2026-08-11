from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.analytics import DashboardSummary, ModelPerformance, PipelineProgress
from app.services import aggregations

import sys
sys.path.append("/app")
from shared.database import get_db  # noqa: E402
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload  # noqa: E402

router = APIRouter()


@router.get("/dashboard/summary", response_model=DashboardSummary)
async def summary(db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    return await aggregations.dashboard_summary(db)


@router.get("/dashboard/pipeline-progress", response_model=list[PipelineProgress])
async def progress(db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    return await aggregations.pipeline_progress(db)


@router.get("/models/performance", response_model=list[ModelPerformance])
async def performance(db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    return await aggregations.model_performance(db)
