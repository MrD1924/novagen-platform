"""SMILES -> feature vector, shared by every prediction head (ADMET, toxicity,
binding affinity, efficacy). Uses RDKit's built-in descriptor set so the featurizer
has zero external model dependency and is deterministic/reproducible."""
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors

FEATURE_NAMES = [
    "MolWt", "MolLogP", "NumHDonors", "NumHAcceptors", "TPSA",
    "NumRotatableBonds", "NumAromaticRings", "RingCount", "FractionCSP3", "HeavyAtomCount",
]


def featurize(smiles: str) -> np.ndarray | None:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    values = [
        Descriptors.MolWt(mol),
        Descriptors.MolLogP(mol),
        Descriptors.NumHDonors(mol),
        Descriptors.NumHAcceptors(mol),
        Descriptors.TPSA(mol),
        Descriptors.NumRotatableBonds(mol),
        Descriptors.NumAromaticRings(mol),
        Descriptors.RingCount(mol),
        Descriptors.FractionCSP3(mol),
        Descriptors.HeavyAtomCount(mol),
    ]
    return np.array(values, dtype=float)
