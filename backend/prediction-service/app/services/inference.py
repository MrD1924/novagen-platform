import os

import joblib
import numpy as np

from app.core.featurize import featurize
from app.core.train_baseline import MODEL_DIR, train_all

_MODEL_CACHE: dict[str, object] = {}


def _load_model(task: str):
    if task in _MODEL_CACHE:
        return _MODEL_CACHE[task]
    path = os.path.join(MODEL_DIR, f"{task}.joblib")
    if not os.path.exists(path):
        train_all()  # first-run bootstrap so the service is immediately usable
    model = joblib.load(path)
    _MODEL_CACHE[task] = model
    return model


def predict_all(smiles: str) -> dict | None:
    feats = featurize(smiles)
    if feats is None:
        return None
    feats2d = feats.reshape(1, -1)

    binding = float(_load_model("binding_affinity").predict(feats2d)[0])
    admet = float(_load_model("admet").predict(feats2d)[0])
    toxicity = float(_load_model("toxicity").predict(feats2d)[0])
    efficacy = float(_load_model("efficacy").predict(feats2d)[0])

    # Confidence heuristic: agreement across per-tree predictions of the RF ensemble
    forest = _load_model("admet").estimators_
    tree_preds = np.array([t.predict(feats2d)[0] for t in forest])
    confidence = float(np.clip(1 - tree_preds.std() * 4, 0.1, 0.99))

    return {
        "binding_affinity_pIC50": round(binding, 3),
        "admet_score": round(admet, 4),
        "toxicity_score": round(toxicity, 4),
        "efficacy_score": round(efficacy, 4),
        "confidence_score": round(confidence, 4),
    }
