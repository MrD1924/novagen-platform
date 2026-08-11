from pydantic import BaseModel


class PredictionRequest(BaseModel):
    smiles: str


class PredictionResponse(BaseModel):
    smiles: str
    binding_affinity_pIC50: float
    admet_score: float
    toxicity_score: float
    efficacy_score: float
    confidence_score: float


class GenerativeMoleculeRequest(BaseModel):
    seed_smiles: str
    num_variants: int = 5


class GenerativeMoleculeResult(BaseModel):
    smiles: str
    valid: bool
    predicted_admet: float | None = None


class DruglikenessResponse(BaseModel):
    descriptors: dict
    lipinski: dict
    veber: dict
    ghose: dict
    overall_drug_like: bool


class DockingRequest(BaseModel):
    ligand_smiles: str
    receptor_pdbqt_path: str  # server-local path to a pre-prepared receptor (see docking.py)
    center_x: float
    center_y: float
    center_z: float
    box_size_x: float = 20.0
    box_size_y: float = 20.0
    box_size_z: float = 20.0
    exhaustiveness: int = 8
    num_poses: int = 9


class DockingPose(BaseModel):
    rank: int
    affinity_kcal_mol: float


class DockingResponse(BaseModel):
    ligand_smiles: str
    receptor: str
    search_box: dict
    poses: list[DockingPose]
    best_affinity_kcal_mol: float | None
