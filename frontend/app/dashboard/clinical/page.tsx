"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HeartPulse, Info } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { clinicalService } from "@/services/domain";

const PHASES = ["preclinical", "phase_1", "phase_2", "phase_3", "phase_4"];

type Trial = {
  id: string;
  phase: string;
  success_prediction: number | null;
  risk_analysis: { flags: string[]; methodology_note: string };
};

export default function ClinicalPage() {
  const [compoundId, setCompoundId] = useState("");
  const [phase, setPhase] = useState("phase_1");
  const [cohortSize, setCohortSize] = useState(120);

  const { data: trials } = useQuery({
    queryKey: ["clinical-trials"],
    queryFn: async () => (await clinicalService.list()).data as Trial[],
  });

  const create = useMutation({
    mutationFn: async () =>
      clinicalService.create({
        compound_id: compoundId,
        phase,
        patient_cohort: { size: cohortSize },
      }),
  });

  return (
    <>
      <Topbar title="Clinical Recommendation" />
      <div className="p-8 space-y-6">
        <div className="bg-navy-950/5 border border-surface-border rounded-xl p-4 flex gap-3">
          <Info size={18} className="text-white/90 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700 leading-relaxed">
            Success/risk estimates here are a transparent, documented heuristic — illustrative phase base
            rates combined with ADMET/toxicity if supplied — not a validated clinical or biostatistical model.
            See the methodology note on each result.
          </p>
        </div>

        <div className="bg-surface-white rounded-xl border border-surface-border p-5 space-y-4">
          <p className="text-sm font-medium text-white flex items-center gap-2">
            <HeartPulse size={16} /> New trial recommendation
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              placeholder="Compound ID (UUID)"
              value={compoundId}
              onChange={(e) => setCompoundId(e.target.value)}
              className="rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
            />
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="rounded-lg border border-surface-border px-4 py-2.5 text-sm bg-surface-white focus:border-navy-900 outline-none"
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>{p.replace("_", " ")}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cohort size"
              value={cohortSize}
              onChange={(e) => setCohortSize(Number(e.target.value))}
              className="rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
            />
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !compoundId}
            className="bg-navy-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
          >
            {create.isPending ? "Estimating…" : "Generate recommendation"}
          </button>
          {create.isError && <p className="text-sm text-red-400">Could not create — check the compound ID is a valid UUID in your library.</p>}
        </div>

        <div className="space-y-3">
          {(trials ?? []).map((t) => (
            <div key={t.id} className="bg-surface-white rounded-xl border border-surface-border p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white capitalize">{t.phase.replace("_", " ")}</p>
                <p className="font-display text-xl font-semibold text-emerald-400">
                  {t.success_prediction !== null ? `${Math.round(t.success_prediction * 100)}%` : "—"}
                </p>
              </div>
              <ul className="text-xs text-ink-500 space-y-1 mb-2">
                {t.risk_analysis.flags?.map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
              <p className="text-xs text-ink-300 italic">{t.risk_analysis.methodology_note}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
