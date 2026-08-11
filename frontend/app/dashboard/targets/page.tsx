"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Target, Plus } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { targetService } from "@/services/domain";

type Protein = {
  id: string;
  name: string;
  uniprot_id: string | null;
  druggability_score: number | null;
};

export default function TargetsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [uniprotId, setUniprotId] = useState("");
  const [sequence, setSequence] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["proteins"],
    queryFn: async () => (await targetService.listProteins()).data as Protein[],
  });

  const create = useMutation({
    mutationFn: async () => targetService.createProtein({ name, uniprot_id: uniprotId || undefined, sequence: sequence || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proteins"] });
      setShowForm(false);
      setName("");
      setUniprotId("");
      setSequence("");
    },
  });

  return (
    <>
      <Topbar title="Target Identification" />
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-500 flex items-center gap-2">
            <Target size={15} /> Protein structures, binding sites, and druggability
          </p>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <Plus size={16} /> Add protein target
          </button>
        </div>

        {showForm && (
          <div className="bg-surface-white rounded-xl border border-surface-border p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Protein name (e.g. EGFR)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
              />
              <input
                placeholder="UniProt ID (e.g. P00533)"
                value={uniprotId}
                onChange={(e) => setUniprotId(e.target.value)}
                className="rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
              />
            </div>
            <textarea
              placeholder="Sequence (optional, FASTA-style residues)"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
            />
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !name}
              className="bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {create.isPending ? "Saving…" : "Save target"}
            </button>
            {create.isError && (
              <p className="text-sm text-red-400 mt-2">
                Could not save: {(create.error as any)?.response?.data?.detail ?? (create.error as Error)?.message ?? "unknown error"}
              </p>
            )}
          </div>
        )}

        <div className="bg-surface-white rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-gray text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">UniProt</th>
                <th className="text-left px-5 py-3 font-medium">Druggability</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={3} className="px-5 py-6 text-center text-ink-300 text-sm">Loading…</td></tr>}
              {!isLoading && (!data || data.length === 0) && (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-ink-300 text-sm">No targets yet — add one above.</td></tr>
              )}
              {(data ?? []).map((p) => (
                <tr key={p.id} className="border-t border-surface-border">
                  <td className="px-5 py-3 text-white">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">{p.uniprot_id ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-500">{p.druggability_score ?? "Not yet scored"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
