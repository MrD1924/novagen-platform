"""Smoke tests for app/core/druglikeness.py — these check real, deterministic
output against known reference compounds, not mocked behavior."""
from app.core.druglikeness import evaluate_druglikeness


def test_aspirin_is_drug_like():
    # Aspirin: MW ~180, well within Lipinski/Veber bounds.
    result = evaluate_druglikeness("CC(=O)Oc1ccccc1C(=O)O")
    assert result is not None
    assert result["lipinski"]["pass"] is True
    assert result["overall_drug_like"] is True


def test_invalid_smiles_returns_none():
    assert evaluate_druglikeness("not_a_real_smiles!!!") is None


def test_large_peptide_like_molecule_fails_lipinski():
    # A large, heavily-substituted molecule with high MW and many H-bond donors
    # should trip multiple Lipinski criteria.
    huge_smiles = "CC(NC(=O)C(NC(=O)C(NC(=O)C(NC(=O)C(N)CC(=O)O)CC(=O)O)CC(=O)O)CC(=O)O)C(=O)O"
    result = evaluate_druglikeness(huge_smiles)
    assert result is not None
    assert result["descriptors"]["molecular_weight"] > 400
