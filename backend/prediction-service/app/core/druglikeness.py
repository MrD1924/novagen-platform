"""Rule-based drug-likeness filters.

Unlike the ML prediction heads in inference.py, these are exact, deterministic
threshold checks on RDKit-computed molecular descriptors — the same published
rules medicinal chemists use. There is no model, no training data, and
therefore nothing here to hallucinate: given a valid SMILES, the output is
reproducible and citable to its source paper every time.

References (for the record, not reproduced here beyond the numeric thresholds
themselves, which are the rules):
- Lipinski et al. 1997, Adv. Drug Deliv. Rev. — "Rule of Five"
- Veber et al. 2002, J. Med. Chem. — oral bioavailability rule
- Ghose et al. 1999, J. Comb. Chem. — qualifying range for drug-like space
"""
from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, Lipinski as RDLipinski


def _descriptors(mol) -> dict:
    return {
        "molecular_weight": Descriptors.MolWt(mol),
        "logp": Crippen.MolLogP(mol),
        "h_bond_donors": RDLipinski.NumHDonors(mol),
        "h_bond_acceptors": RDLipinski.NumHAcceptors(mol),
        "rotatable_bonds": Descriptors.NumRotatableBonds(mol),
        "tpsa": Descriptors.TPSA(mol),
        "molar_refractivity": Crippen.MolMR(mol),
        "heavy_atom_count": Descriptors.HeavyAtomCount(mol),
    }


def evaluate_druglikeness(smiles: str) -> dict | None:
    """Returns descriptor values plus pass/fail against each named rule set,
    or None if the SMILES does not parse. Every threshold below is the
    published rule verbatim — nothing here is model output."""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None

    d = _descriptors(mol)

    # --- Lipinski's Rule of Five: no more than one violation permitted ---
    lipinski_violations = sum(
        [
            d["molecular_weight"] > 500,
            d["logp"] > 5,
            d["h_bond_donors"] > 5,
            d["h_bond_acceptors"] > 10,
        ]
    )
    lipinski_pass = lipinski_violations <= 1

    # --- Veber's rule: oral bioavailability ---
    veber_pass = d["rotatable_bonds"] <= 10 and d["tpsa"] <= 140

    # --- Ghose filter: qualifying range for drug-like chemical space ---
    ghose_pass = (
        160 <= d["molecular_weight"] <= 480
        and -0.4 <= d["logp"] <= 5.6
        and 40 <= d["molar_refractivity"] <= 130
        and 20 <= d["heavy_atom_count"] <= 70
    )

    return {
        "descriptors": {k: round(v, 3) for k, v in d.items()},
        "lipinski": {
            "pass": lipinski_pass,
            "violations": lipinski_violations,
            "rule": "MW ≤ 500, LogP ≤ 5, HBD ≤ 5, HBA ≤ 10 — ≤1 violation allowed",
        },
        "veber": {
            "pass": veber_pass,
            "rule": "Rotatable bonds ≤ 10, TPSA ≤ 140 Ų",
        },
        "ghose": {
            "pass": ghose_pass,
            "rule": "160 ≤ MW ≤ 480, -0.4 ≤ LogP ≤ 5.6, 40 ≤ MR ≤ 130, 20 ≤ atoms ≤ 70",
        },
        "overall_drug_like": lipinski_pass and veber_pass,
    }
