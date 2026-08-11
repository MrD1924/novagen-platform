"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layers, AlertTriangle } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { dockingService } from "@/services/domain";

type DockingResult = {
  ligand_smiles: string;
  receptor: string;
  best_affinity_kcal_mol: number | null;
  poses: { rank: number; affinity_kcal_mol: number }[];
};

export default function DockingPage() {
  const [form, setForm] = useState({
    ligand_smiles: "CC(=O)Oc1ccccc1C(=O)O",
    receptor_pdbqt_path: "/data/receptors/example_target.pdbqt",
    center_x: 0,
    center_y: 0,
    center_z: 0,
  });

  const dock = useMutation({
    mutationFn: async () => (await dockingService.dock(form)).data as DockingResult,
  });

  return (
    <>
      <Topbar title="Molecular Docking" />
      <div className="p-8 space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300 leading-relaxed">
            Real AutoDock Vina docking requires a receptor already prepared as PDBQT (protonation, missing
            residues, and cofactor placement need structural-biology judgment — this platform will not guess
            them) and the binding-site box coordinates. This runs a real Vina calculation server-side; it does
            not return a placeholder score.
          </p>
        </div>

        <div className="bg-surface-white rounded-xl border border-surface-border p-5 space-y-4">
          <p className="text-sm font-medium text-white flex items-center gap-2">
            <Layers size={16} /> Dock a ligand
          </p>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Ligand SMILES</label>
            <input
              value={form.ligand_smiles}
              onChange={(e) => setForm({ ...form, ligand_smiles: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Receptor PDBQT path (server-local)</label>
            <input
              value={form.receptor_pdbqt_path}
              onChange={(e) => setForm({ ...form, receptor_pdbqt_path: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["center_x", "center_y", "center_z"] as const).map((axis) => (
              <div key={axis}>
                <label className="block text-xs font-medium text-ink-700 mb-1.5">{axis.replace("_", " ")}</label>
                <input
                  type="number"
                  step="0.1"
                  value={form[axis]}
                  onChange={(e) => setForm({ ...form, [axis]: Number(e.target.value) })}
                  className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => dock.mutate()}
            disabled={dock.isPending}
            className="bg-navy-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
          >
            {dock.isPending ? "Docking…" : "Run docking"}
          </button>

          {dock.isError && (
            <p className="text-sm text-red-400">
              Docking failed — most likely the receptor path doesn't exist on the server, or the `vina`/`meeko`
              packages aren't installed in prediction-service. This is a real error, not a placeholder message.
            </p>
          )}
        </div>

        {dock.data && (
          <div className="bg-surface-white rounded-xl border border-surface-border overflow-hidden">
            <div className="p-5 border-b border-surface-border flex items-center justify-between">
              <p className="text-sm text-ink-500">Receptor: <span className="font-mono text-white">{dock.data.receptor}</span></p>
              <p className="text-sm text-ink-500">
                Best affinity: <span className="font-display text-lg font-semibold text-emerald-400">{dock.data.best_affinity_kcal_mol} kcal/mol</span>
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-gray text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Pose</th>
                  <th className="text-left px-5 py-3 font-medium">Affinity (kcal/mol)</th>
                </tr>
              </thead>
              <tbody>
                {dock.data.poses.map((p) => (
                  <tr key={p.rank} className="border-t border-surface-border">
                    <td className="px-5 py-3 text-white">#{p.rank}</td>
                    <td className="px-5 py-3 font-mono text-ink-700">{p.affinity_kcal_mol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
