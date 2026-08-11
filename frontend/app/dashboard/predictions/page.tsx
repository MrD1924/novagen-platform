"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BrainCircuit, CheckCircle2, XCircle } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { predictionService, druglikenessService } from "@/services/domain";

type Prediction = {
  smiles: string;
  binding_affinity_pIC50: number;
  admet_score: number;
  toxicity_score: number;
  efficacy_score: number;
  confidence_score: number;
};

type Druglikeness = {
  descriptors: Record<string, number>;
  lipinski: { pass: boolean; violations: number; rule: string };
  veber: { pass: boolean; rule: string };
  ghose: { pass: boolean; rule: string };
  overall_drug_like: boolean;
};

const METRICS: { key: keyof Prediction; label: string; format: (v: number) => string }[] = [
  { key: "binding_affinity_pIC50", label: "Binding affinity (pIC50)", format: (v) => v.toFixed(2) },
  { key: "admet_score", label: "ADMET score", format: (v) => `${Math.round(v * 100)}%` },
  { key: "toxicity_score", label: "Toxicity score", format: (v) => `${Math.round(v * 100)}%` },
  { key: "efficacy_score", label: "Efficacy score", format: (v) => `${Math.round(v * 100)}%` },
];

export default function PredictionsPage() {
  const [smiles, setSmiles] = useState("CN1C=NC2=C1C(=O)N(C(=O)N2C)C");
  const predict = useMutation({
    mutationFn: async () => (await predictionService.predict(smiles)).data as Prediction,
  });
  const druglikeness = useMutation({
    mutationFn: async () => (await druglikenessService.evaluate(smiles)).data as Druglikeness,
  });

  const runAll = () => {
    predict.mutate();
    druglikeness.mutate();
  };

  return (
    <>
      <Topbar title="AI Predictions" />
      <div className="p-8 space-y-6">
        <div className="bg-surface-white rounded-xl border border-surface-border p-5">
          <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <BrainCircuit size={16} /> Run the AI prediction engine
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              placeholder="Compound SMILES"
              className="flex-1 rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
            />
            <button
              onClick={runAll}
              disabled={predict.isPending || druglikeness.isPending}
              className="bg-navy-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
            >
              {predict.isPending || druglikeness.isPending ? "Predicting…" : "Predict"}
            </button>
          </div>
          {(predict.isError || druglikeness.isError) && <p className="text-sm text-red-400 mt-3">Invalid SMILES string.</p>}
        </div>

        {predict.data && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICS.map((m) => (
              <div key={m.key} className="bg-surface-white rounded-xl border border-surface-border p-5">
                <p className="text-xs text-ink-500 mb-2">{m.label}</p>
                <p className="font-display text-2xl font-semibold text-white">{m.format(predict.data![m.key] as number)}</p>
              </div>
            ))}
            <div className="bg-navy-950 text-white rounded-xl p-5 sm:col-span-2 lg:col-span-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 mb-1">Model confidence</p>
                <p className="font-display text-2xl font-semibold text-emerald-400">
                  {Math.round(predict.data.confidence_score * 100)}%
                </p>
              </div>
              <p className="text-xs text-white/50 font-mono max-w-xs text-right">
                RandomForest ensemble agreement across ADMET estimators
              </p>
            </div>
          </div>
        )}

        {druglikeness.data && (
          <div className="bg-surface-white rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white">
                Drug-likeness — exact rule evaluation, not model output
              </p>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  druglikeness.data.overall_drug_like ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
                }`}
              >
                {druglikeness.data.overall_drug_like ? "Drug-like" : "Flags raised"}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              {[
                { key: "lipinski", label: "Lipinski's Rule of Five", data: druglikeness.data.lipinski },
                { key: "veber", label: "Veber's rule", data: druglikeness.data.veber },
                { key: "ghose", label: "Ghose filter", data: druglikeness.data.ghose },
              ].map(({ key, label, data }) => (
                <div key={key} className="border border-surface-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {data.pass ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                    <p className="text-sm font-medium text-white">{label}</p>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed">{data.rule}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-ink-700">
              {Object.entries(druglikeness.data.descriptors).map(([key, value]) => (
                <div key={key} className="bg-surface-gray rounded px-3 py-2">
                  <p className="text-ink-300">{key}</p>
                  <p className="text-white font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
