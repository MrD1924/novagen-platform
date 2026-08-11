from uuid import UUID

from pydantic import BaseModel

PIPELINE_STAGES = [
    "disease_identification",
    "target_identification",
    "molecule_screening",
    "ai_prediction",
    "laboratory_validation",
    "clinical_recommendation",
    "reporting",
]


class PipelineRunCreate(BaseModel):
    project_id: UUID
    disease_id: UUID | None = None


class PipelineRunResponse(BaseModel):
    pipeline_run_id: str
    project_id: UUID
    current_stage: str
    stages: list[str]
    status: str


class AdvanceStageRequest(BaseModel):
    pipeline_run_id: str
    to_stage: str
