"""Trains baseline scikit-learn regressors for each prediction head and saves them
to /app/models/*.joblib.

IMPORTANT: this ships with a small synthetically-labeled seed set (physically-motivated
heuristics over RDKit descriptors — e.g. higher logP/TPSA nudging toxicity up) purely so
the service has *something real to run inference against* out of the box. Swap
`SEED_SMILES` + the label functions for an actual labeled dataset (ChEMBL, Tox21, etc.)
before using this for real predictions — see docs/AI_MODELS.md.
"""
import os

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor

from app.core.featurize import featurize

MODEL_DIR = os.environ.get("MODEL_DIR", "/app/models")

SEED_SMILES = [
    "CCO", "CC(=O)Oc1ccccc1C(=O)O", "c1ccccc1", "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
    "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", "CC(=O)Nc1ccc(O)cc1", "O=C(C)Oc1ccccc1C(=O)O",
    "C1=CC=C2C(=C1)C=CC=C2", "CC(C)NCC(O)COc1ccccc1CC=C", "CCN(CC)CCNC(=O)c1cc(ccc1OC)S(N)(=O)=O",
    "COc1cc2c(cc1OC)C(=O)C(CC2)Cc1ccc(cc1)OC", "CC1=CC(=O)CC(C)(C)C1",
    "Clc1ccc(cc1)C(c1ccccc1)N1CCN(CC1)CCOCCO", "CC(C)(C)NCC(O)c1ccc(O)c(O)c1",
    "CC(=O)c1ccc(cc1)S(=O)(=O)N", "Cc1ccc(cc1)S(=O)(=O)N", "CCOC(=O)c1ccccc1N",
    "COC(=O)c1ccccc1O", "CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O", "CC(C)Cc1ccccc1",
]


def _heuristic_labels(features: np.ndarray) -> dict[str, float]:
    mol_wt, logp, hdon, hacc, tpsa, rot, arom, rings, fcsp3, heavy = features
    return {
        "binding_affinity": float(np.clip(9.0 - 0.02 * mol_wt + 0.3 * logp - 0.01 * tpsa, 0, 14)),
        "admet": float(np.clip(1 / (1 + np.exp(-(0.05 * (500 - mol_wt) - 0.03 * tpsa + 0.2 * logp))), 0, 1)),
        "toxicity": float(np.clip(1 / (1 + np.exp(-(0.02 * mol_wt + 0.4 * logp - 0.01 * tpsa - 2))), 0, 1)),
        "efficacy": float(np.clip(0.5 + 0.05 * arom - 0.01 * rot + 0.1 * fcsp3, 0, 1)),
    }


def train_all() -> dict[str, str]:
    os.makedirs(MODEL_DIR, exist_ok=True)
    X, y = {}, {}
    for task in ("binding_affinity", "admet", "toxicity", "efficacy"):
        X[task], y[task] = [], []

    for smiles in SEED_SMILES:
        feats = featurize(smiles)
        if feats is None:
            continue
        labels = _heuristic_labels(feats)
        for task, value in labels.items():
            X[task].append(feats)
            y[task].append(value)

    saved = {}
    for task in X:
        model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
        model.fit(np.array(X[task]), np.array(y[task]))
        path = os.path.join(MODEL_DIR, f"{task}.joblib")
        joblib.dump(model, path)
        saved[task] = path
    return saved


if __name__ == "__main__":
    print(train_all())
