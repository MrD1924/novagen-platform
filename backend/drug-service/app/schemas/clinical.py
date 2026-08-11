from uuid import UUID

from pydantic import BaseModel


class ClinicalTrialCreate(BaseModel):
    compound_id: UUID
    disease_id: UUID | None = None
    phase: str = "preclinical"
    patient_cohort: dict = {}  # e.g. {"size": 120, "criteria": "EGFR-mutant NSCLC, stage III-IV"}
    admet_score: float | None = None  # optional: pass through from a prior /prediction/predict call
    toxicity_score: float | None = None
    phase_base_rate_override: float | None = None


class ClinicalTrialResponse(BaseModel):
    id: UUID
    compound_id: UUID
    disease_id: UUID | None
    phase: str
    patient_cohort: dict
    success_prediction: float | None
    risk_analysis: dict

    class Config:
        from_attributes = True
