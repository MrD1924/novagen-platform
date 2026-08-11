"""Molecular docking via the standalone AutoDock Vina executable + Meeko for
ligand preparation.

WHY THE CLI, NOT THE PYTHON BINDINGS: the PyPI `vina` package has no
pre-built wheels for any platform — it always compiles from source against
the Boost C++ library. This is a well-documented, still-unresolved pain
point on Windows specifically (see e.g. ccsb-scripps/AutoDock-Vina issue
#247 on GitHub, which shows the exact same "Boost library is not installed
in this conda environment" failure even when following the official
install steps to the letter). Rather than keep fighting that build, this
module shells out to the official standalone `vina.exe` / `vina` binary,
which AutoDock Vina publishes pre-built for Windows/Linux/macOS and needs
no Boost, no compiler, no Python bindings at all.

WHAT THIS DOES: given a ligand SMILES and a receptor already prepared as
PDBQT (hydrogens added, charges assigned — see note below), runs a real Vina
docking calculation via subprocess and parses its actual output. There is no
fallback path that invents a score; if the vina executable isn't found, the
receptor file is missing, or the ligand fails to embed in 3D, this raises
rather than returning a plausible-looking number.

WHAT THIS DELIBERATELY DOES NOT DO: prepare the receptor for you. Receptor
preparation (protonation state, missing loops/residues, tautomers, crystal
waters, cofactors) requires structural-biology judgment that no automated
pipeline should silently make. Prepare receptors with a tool like ADFR's
`prepare_receptor` or Open Babel, save as PDBQT, and pass the file path here.
Similarly, the search-box center/size (the binding site) must be supplied.

Setup required (see deployment/native/README.md for the full walkthrough):
1. Download the vina executable for your OS from
   https://github.com/ccsb-scripps/AutoDock-Vina/releases (e.g.
   `vina_1.2.5_win.exe` for Windows) and place it somewhere on disk.
2. Set VINA_EXECUTABLE_PATH in .env to that file's full path (or leave it as
   just "vina" if you've put it on your system PATH).
3. `pip install meeko` — this one is pure Python, no Boost needed, and
   should install cleanly everywhere.
"""
import os
import subprocess
import tempfile

from rdkit import Chem
from rdkit.Chem import AllChem


class DockingInputError(ValueError):
    pass


class DockingUnavailableError(RuntimeError):
    pass


def _vina_executable() -> str:
    return os.environ.get("VINA_EXECUTABLE_PATH", "vina")


def _prepare_ligand_pdbqt(smiles: str) -> str:
    """SMILES -> 3D-embedded, hydrogenated RDKit mol -> PDBQT via Meeko.

    NOTE: written against Meeko's ~0.5.x API (MoleculePreparation +
    PDBQTWriterLegacy). Meeko's API has shifted somewhat across releases —
    if you're on meeko>=0.6 and this raises an AttributeError/ImportError,
    check `python -c "import meeko; help(meeko)"` for the current class
    names in your installed version and adjust the two lines below
    accordingly. This has not been executed against meeko 0.7.x directly.
    """
    try:
        from meeko import MoleculePreparation, PDBQTWriterLegacy
    except ImportError as exc:
        raise DockingUnavailableError(
            "meeko is not installed in this environment. Add `meeko` to requirements.txt and rebuild."
        ) from exc

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise DockingInputError(f"Invalid ligand SMILES: {smiles}")

    mol = Chem.AddHs(mol)
    embed_result = AllChem.EmbedMolecule(mol, randomSeed=42, useRandomCoords=True)
    if embed_result != 0:
        raise DockingInputError(f"RDKit could not generate a 3D conformer for: {smiles}")
    AllChem.MMFFOptimizeMolecule(mol)

    preparator = MoleculePreparation()
    setups = preparator.prepare(mol)
    if not setups:
        raise DockingInputError(f"Meeko could not prepare a docking-ready structure for: {smiles}")

    pdbqt_string, _, _ = PDBQTWriterLegacy.write_string(setups[0])
    return pdbqt_string


def _parse_vina_log(log_text: str) -> list[dict]:
    """Parses Vina's stdout results table:
        mode |   affinity | dist from best mode
             | (kcal/mol) | rmsd l.b.| rmsd u.b.
        -----+------------+----------+----------
           1        -6.4      0.000      0.000
           2        -6.1      1.845      2.923
    """
    poses = []
    in_table = False
    for line in log_text.splitlines():
        stripped = line.strip()
        if stripped.startswith("-----"):
            in_table = True
            continue
        if in_table and stripped:
            parts = stripped.split()
            if len(parts) >= 2 and parts[0].isdigit():
                try:
                    poses.append({"rank": int(parts[0]), "affinity_kcal_mol": float(parts[1])})
                except ValueError:
                    continue
    return poses


def run_docking(
    ligand_smiles: str,
    receptor_pdbqt_path: str,
    center: tuple[float, float, float],
    box_size: tuple[float, float, float] = (20.0, 20.0, 20.0),
    exhaustiveness: int = 8,
    num_poses: int = 9,
) -> dict:
    """Runs a real Vina docking job via the standalone executable. Returns
    actual computed poses/scores parsed from Vina's own output.

    Raises DockingInputError for bad ligand/receptor input,
    DockingUnavailableError if the vina executable or meeko package aren't
    available. Never returns a fabricated result.
    """
    if not os.path.exists(receptor_pdbqt_path):
        raise DockingInputError(
            f"Receptor PDBQT not found at {receptor_pdbqt_path}. Prepare it first "
            "(e.g. with ADFR's prepare_receptor) — this module does not auto-prepare receptors."
        )

    ligand_pdbqt = _prepare_ligand_pdbqt(ligand_smiles)

    with tempfile.TemporaryDirectory() as tmpdir:
        ligand_path = os.path.join(tmpdir, "ligand.pdbqt")
        out_path = os.path.join(tmpdir, "out.pdbqt")
        with open(ligand_path, "w") as f:
            f.write(ligand_pdbqt)

        cmd = [
            _vina_executable(),
            "--receptor", receptor_pdbqt_path,
            "--ligand", ligand_path,
            "--center_x", str(center[0]),
            "--center_y", str(center[1]),
            "--center_z", str(center[2]),
            "--size_x", str(box_size[0]),
            "--size_y", str(box_size[1]),
            "--size_z", str(box_size[2]),
            "--exhaustiveness", str(exhaustiveness),
            "--num_modes", str(num_poses),
            "--out", out_path,
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        except FileNotFoundError as exc:
            raise DockingUnavailableError(
                f"Vina executable not found at '{_vina_executable()}'. Download it from "
                "https://github.com/ccsb-scripps/AutoDock-Vina/releases and set "
                "VINA_EXECUTABLE_PATH in .env to its full path."
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise DockingUnavailableError("Vina did not finish within 300 seconds.") from exc

        if result.returncode != 0:
            raise DockingUnavailableError(f"Vina exited with an error:\n{result.stderr or result.stdout}")

        poses = _parse_vina_log(result.stdout)
        if not poses:
            raise DockingUnavailableError(
                f"Vina ran but no poses could be parsed from its output. Raw stdout:\n{result.stdout[-1000:]}"
            )

        return {
            "ligand_smiles": ligand_smiles,
            "receptor": os.path.basename(receptor_pdbqt_path),
            "search_box": {"center": center, "size": box_size},
            "poses": poses,
            "best_affinity_kcal_mol": poses[0]["affinity_kcal_mol"] if poses else None,
        }
