"""Virtual screening / similarity search — real RDKit chemistry, not a mock.

Computes Morgan fingerprints and Tanimoto similarity against the compound library
stored in Postgres. This is the concrete implementation behind Module 3 (Molecule
Screening) in the product spec.
"""
from rdkit import Chem
from rdkit.Chem import AllChem, DataStructs
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.drug import Compound
from app.schemas.drug import MoleculeScreenResult


def _fingerprint(smiles: str):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    return AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=2048)


async def screen_library(db: AsyncSession, query_smiles: str, top_k: int, min_similarity: float) -> list[MoleculeScreenResult]:
    query_fp = _fingerprint(query_smiles)
    if query_fp is None:
        raise ValueError(f"Invalid SMILES: {query_smiles}")

    result = await db.execute(select(Compound))
    candidates = result.scalars().all()

    scored: list[MoleculeScreenResult] = []
    for compound in candidates:
        fp = _fingerprint(compound.smiles)
        if fp is None:
            continue
        similarity = DataStructs.TanimotoSimilarity(query_fp, fp)
        if similarity >= min_similarity:
            scored.append(
                MoleculeScreenResult(
                    compound_id=compound.id,
                    smiles=compound.smiles,
                    similarity=round(similarity, 4),
                    molecular_weight=float(compound.molecular_weight) if compound.molecular_weight else None,
                )
            )

    scored.sort(key=lambda r: r.similarity, reverse=True)
    return scored[:top_k]


def compute_molecular_weight(smiles: str) -> float | None:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    from rdkit.Chem import Descriptors

    return round(Descriptors.MolWt(mol), 3)
