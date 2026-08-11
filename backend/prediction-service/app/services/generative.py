"""Generative molecule variants.

Ships with a lightweight RDKit fragment-mutation generator so the endpoint is
functional end-to-end out of the box. Swap `generate_variants` for a trained
generative model (e.g. a HuggingFace SMILES-transformer or graph VAE checkpoint
loaded from the model_registry table) without changing the API contract —
see docs/AI_MODELS.md, Stage 4 notes.
"""
import random

from rdkit import Chem
from rdkit.Chem import BRICS

from app.services.inference import predict_all


def generate_variants(seed_smiles: str, num_variants: int) -> list[dict]:
    mol = Chem.MolFromSmiles(seed_smiles)
    if mol is None:
        return []

    fragments = list(BRICS.BRICSDecompose(mol))
    candidates: set[str] = set()

    # Simple combinatorial re-assembly of BRICS fragments as a stand-in generative step.
    if len(fragments) >= 2:
        for _ in range(num_variants * 3):
            sampled = random.sample(fragments, k=min(2, len(fragments)))
            try:
                built = next(iter(BRICS.BRICSBuild([Chem.MolFromSmiles(f) for f in sampled])))
                smi = Chem.MolToSmiles(built)
                if smi and smi != seed_smiles:
                    candidates.add(smi)
            except StopIteration:
                continue
            if len(candidates) >= num_variants:
                break

    results = []
    for smi in list(candidates)[:num_variants]:
        valid_mol = Chem.MolFromSmiles(smi)
        admet = None
        if valid_mol is not None:
            pred = predict_all(smi)
            admet = pred["admet_score"] if pred else None
        results.append({"smiles": smi, "valid": valid_mol is not None, "predicted_admet": admet})
    return results
