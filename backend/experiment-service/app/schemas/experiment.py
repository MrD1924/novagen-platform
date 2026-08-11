from uuid import UUID

from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    project_id: UUID
    compound_id: UUID | None = None
    title: str
    protocol: dict = {}
    assigned_to: UUID | None = None


class ExperimentUpdate(BaseModel):
    status: str | None = None
    results: dict | None = None


class ExperimentResponse(BaseModel):
    id: UUID
    project_id: UUID
    compound_id: UUID | None
    title: str
    status: str
    protocol: dict
    results: dict
    assigned_to: UUID | None

    class Config:
        from_attributes = True


class SampleCreate(BaseModel):
    experiment_id: UUID
    barcode: str


class SampleQCUpdate(BaseModel):
    status: str
    quality_control: dict = {}


class SampleResponse(BaseModel):
    id: UUID
    experiment_id: UUID
    barcode: str
    status: str
    quality_control: dict

    class Config:
        from_attributes = True
