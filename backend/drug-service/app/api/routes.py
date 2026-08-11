from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.drug import Compound, Disease, Protein
from app.schemas.drug import (
    CompoundCreate,
    DiseaseCreate,
    DiseaseResponse,
    LiteratureArticle,
    LiteratureSearchRequest,
    MoleculeScreenRequest,
    MoleculeScreenResult,
    ProteinCreate,
    ProteinResponse,
)
from app.models.clinical import ClinicalTrial
from app.schemas.clinical import ClinicalTrialCreate, ClinicalTrialResponse
from app.services import clinical_estimation, screening, literature

import sys
sys.path.append("/app")
from shared.database import get_db  # noqa: E402
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload  # noqa: E402

router = APIRouter()


# ---------- Module 1: Disease Identification ----------
@router.post("/diseases", response_model=DiseaseResponse, status_code=201)
async def create_disease(payload: DiseaseCreate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    disease = Disease(**payload.model_dump())
    db.add(disease)
    await db.commit()
    await db.refresh(disease)
    return disease


@router.get("/diseases", response_model=list[DiseaseResponse])
async def list_diseases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disease))
    return result.scalars().all()


# ---------- Module 2: Target Identification ----------
@router.post("/proteins", response_model=ProteinResponse, status_code=201)
async def create_protein(payload: ProteinCreate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    protein = Protein(**payload.model_dump())
    db.add(protein)
    await db.commit()
    await db.refresh(protein)
    return protein


@router.get("/proteins", response_model=list[ProteinResponse])
async def list_proteins(disease_id: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Protein)
    if disease_id:
        query = query.where(Protein.disease_id == disease_id)
    result = await db.execute(query)
    return result.scalars().all()


# ---------- Module 3: Molecule Screening ----------
@router.post("/compounds", status_code=201)
async def add_compound(payload: CompoundCreate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    mw = screening.compute_molecular_weight(payload.smiles)
    if mw is None:
        raise HTTPException(400, "Invalid SMILES string")
    compound = Compound(name=payload.name, smiles=payload.smiles, molecular_weight=mw, project_id=payload.project_id, source="database")
    db.add(compound)
    await db.commit()
    await db.refresh(compound)
    return {"id": str(compound.id), "smiles": compound.smiles, "molecular_weight": mw}


@router.post("/screen", response_model=list[MoleculeScreenResult])
async def screen_compounds(payload: MoleculeScreenRequest, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)):
    try:
        return await screening.screen_library(db, payload.query_smiles, payload.top_k, payload.min_similarity)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


# ---------- Literature (real PubMed lookup via NCBI E-utilities) ----------
@router.post("/literature", response_model=list[LiteratureArticle])
async def search_literature(payload: LiteratureSearchRequest, _: TokenPayload = Depends(get_current_user)):
    """Live PubMed search — every article returned is a real record fetched
    from NCBI at request time, not model-generated. Returns an empty list
    (not an error) when there are genuinely no matching records."""
    import sys
    sys.path.append("/app")
    from shared.config import get_settings

    settings = get_settings()
    try:
        return await literature.search_pubmed(payload.query, payload.max_results, settings.ncbi_api_key or None)
    except Exception as exc:
        raise HTTPException(502, f"PubMed lookup failed: {exc}") from exc


# ---------- Module 6: Clinical Recommendation ----------
@router.post("/clinical-trials", response_model=ClinicalTrialResponse, status_code=201)
async def create_clinical_trial(
    payload: ClinicalTrialCreate, db: AsyncSession = Depends(get_db), _: TokenPayload = Depends(get_current_user)
):
    """Creates a clinical trial recommendation record with a transparent,
    documented success/risk heuristic — see app/services/clinical_estimation.py
    for exactly how the numbers are derived. This is explicitly NOT a
    validated clinical prediction model."""
    estimate = clinical_estimation.estimate_success_and_risk(
        phase=payload.phase,
        cohort_size=payload.patient_cohort.get("size"),
        admet_score=payload.admet_score,
        toxicity_score=payload.toxicity_score,
        phase_base_rate_override=payload.phase_base_rate_override,
    )
    trial = ClinicalTrial(
        compound_id=payload.compound_id,
        disease_id=payload.disease_id,
        phase=payload.phase,
        patient_cohort=payload.patient_cohort,
        success_prediction=estimate["success_prediction"],
        risk_analysis=estimate["risk_analysis"],
    )
    db.add(trial)
    await db.commit()
    await db.refresh(trial)
    return trial


@router.get("/clinical-trials", response_model=list[ClinicalTrialResponse])
async def list_clinical_trials(compound_id: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(ClinicalTrial)
    if compound_id:
        query = query.where(ClinicalTrial.compound_id == compound_id)
    result = await db.execute(query.order_by(ClinicalTrial.created_at.desc()))
    return result.scalars().all()
