from uuid import UUID

from pydantic import BaseModel


class DiseaseCreate(BaseModel):
    name: str
    disease_ontology_id: str | None = None
    description: str | None = None
    biomarkers: list[str] = []
    associated_genes: list[str] = []


class DiseaseResponse(DiseaseCreate):
    id: UUID

    class Config:
        from_attributes = True


class ProteinCreate(BaseModel):
    name: str
    uniprot_id: str | None = None
    sequence: str | None = None
    disease_id: UUID | None = None


class ProteinResponse(ProteinCreate):
    id: UUID
    druggability_score: float | None = None

    class Config:
        from_attributes = True


class MoleculeScreenRequest(BaseModel):
    """Virtual screening / similarity search request."""
    query_smiles: str
    top_k: int = 10
    min_similarity: float = 0.6


class MoleculeScreenResult(BaseModel):
    compound_id: UUID | None = None
    smiles: str
    similarity: float
    molecular_weight: float | None = None


class CompoundCreate(BaseModel):
    name: str | None = None
    smiles: str
    project_id: UUID | None = None


class LiteratureSearchRequest(BaseModel):
    query: str
    max_results: int = 10


class LiteratureArticle(BaseModel):
    pmid: str
    title: str
    journal: str
    pub_date: str
    authors: list[str]
    url: str
