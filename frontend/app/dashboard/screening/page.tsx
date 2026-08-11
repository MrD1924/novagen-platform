"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { drugService } from "@/services/domain";

type ScreenResult = { compound_id: string | null; smiles: string; similarity: number; molecular_weight: number | null };

export default function ScreeningPage() {
  const [smiles, setSmiles] = useState("CC(=O)Oc1ccccc1C(=O)O");
  const [topK, setTopK] = useState(10);

  const screen = useMutation({
    mutationFn: async () => (await drugService.screen(smiles, topK, 0.5)).data as ScreenResult[],
  });

  return (
    <>
      <Topbar title="Molecule Screening" />
      <div className="p-8 space-y-6">
        <div className="bg-surface-white rounded-xl border border-surface-border p-5">
          <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <FlaskConical size={16} /> Virtual screening — similarity search
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              placeholder="Query SMILES, e.g. CC(=O)Oc1ccccc1C(=O)O"
              className="flex-1 rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
            />
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-24 rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
            />
            <button
              onClick={() => screen.mutate()}
              disabled={screen.isPending}
              className="bg-navy-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
            >
              {screen.isPending ? "Screening…" : "Screen library"}
            </button>
          </div>
          {screen.isError && <p className="text-sm text-red-400 mt-3">Invalid SMILES or the library is empty — try seeding some compounds first.</p>}
        </div>

        {screen.data && (
          <div className="bg-surface-white rounded-xl border border-surface-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-gray text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">SMILES</th>
                  <th className="text-left px-5 py-3 font-medium">Similarity</th>
                  <th className="text-left px-5 py-3 font-medium">MW</th>
                </tr>
              </thead>
              <tbody>
                {screen.data.map((r, i) => (
                  <tr key={i} className="border-t border-surface-border">
                    <td className="px-5 py-3 font-mono text-xs text-white">{r.smiles}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-16 h-1.5 rounded-full bg-surface-border overflow-hidden">
                          <span className="block h-full bg-emerald-500" style={{ width: `${r.similarity * 100}%` }} />
                        </span>
                        {r.similarity.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{r.molecular_weight?.toFixed(1) ?? "—"}</td>
                  </tr>
                ))}
                {screen.data.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-ink-300 text-sm">
                      No compounds above the similarity threshold.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
