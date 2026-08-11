from fastapi import APIRouter, Depends, HTTPException

from app.schemas.prediction import (
    DockingRequest,
    DockingResponse,
    DruglikenessResponse,
    GenerativeMoleculeRequest,
    GenerativeMoleculeResult,
    PredictionRequest,
    PredictionResponse,
)
from app.services import generative, inference
from app.core.druglikeness import evaluate_druglikeness
from app.services import docking as docking_service

import sys
sys.path.append("/app")
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload  # noqa: E402

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict(payload: PredictionRequest, _: TokenPayload = Depends(get_current_user)):
    result = inference.predict_all(payload.smiles)
    if result is None:
        raise HTTPException(400, "Invalid SMILES string")
    return PredictionResponse(smiles=payload.smiles, **result)


@router.post("/generate", response_model=list[GenerativeMoleculeResult])
async def generate(payload: GenerativeMoleculeRequest, _: TokenPayload = Depends(get_current_user)):
    variants = generative.generate_variants(payload.seed_smiles, payload.num_variants)
    if not variants:
        raise HTTPException(400, "Could not generate variants for the given seed SMILES")
    return variants


@router.post("/druglikeness", response_model=DruglikenessResponse)
async def druglikeness(payload: PredictionRequest, _: TokenPayload = Depends(get_current_user)):
    """Exact Lipinski/Veber/Ghose rule evaluation — deterministic, not model output."""
    result = evaluate_druglikeness(payload.smiles)
    if result is None:
        raise HTTPException(400, "Invalid SMILES string")
    return result


@router.post("/dock", response_model=DockingResponse)
async def dock(payload: DockingRequest, _: TokenPayload = Depends(get_current_user)):
    """Real AutoDock Vina docking. Requires a receptor already prepared as
    PDBQT on the server filesystem and an explicit search box — see
    app/services/docking.py for why this is not auto-prepared. Raises 422 for
    bad input, 503 if the vina/meeko packages aren't installed, rather than
    ever returning a fabricated score."""
    try:
        result = docking_service.run_docking(
            ligand_smiles=payload.ligand_smiles,
            receptor_pdbqt_path=payload.receptor_pdbqt_path,
            center=(payload.center_x, payload.center_y, payload.center_z),
            box_size=(payload.box_size_x, payload.box_size_y, payload.box_size_z),
            exhaustiveness=payload.exhaustiveness,
            num_poses=payload.num_poses,
        )
    except docking_service.DockingInputError as exc:
        raise HTTPException(422, str(exc)) from exc
    except docking_service.DockingUnavailableError as exc:
        raise HTTPException(503, str(exc)) from exc

    return result
