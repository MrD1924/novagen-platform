from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_projects: int
    active_experiments: int
    predictions_last_30d: int
    average_prediction_confidence: float
    compounds_in_library: int


class ModelPerformance(BaseModel):
    model_name: str
    version: str
    task: str
    metrics: dict


class PipelineProgress(BaseModel):
    stage: str
    completed: int
    total: int
