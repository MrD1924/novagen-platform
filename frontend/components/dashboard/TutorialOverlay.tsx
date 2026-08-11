"use client";

import { useEffect, useState } from "react";
import {
  Target, FlaskConical, BrainCircuit, Layers, BookOpen,
  Microscope, HeartPulse, FileBarChart, Sparkles, X,
} from "lucide-react";

const STORAGE_KEY = "novagen_tutorial_completed";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to NovaGen",
    body: "One platform for the whole drug discovery pipeline — from target identification to clinical recommendation, all sharing the same underlying data.",
  },
  {
    icon: Target,
    title: "Target Identification & Screening",
    body: "Track diseases, proteins, and binding sites, then screen compounds with real Tanimoto similarity search against your library.",
  },
  {
    icon: BrainCircuit,
    title: "AI Predictions & Docking",
    body: "Get binding affinity, ADMET, toxicity, and efficacy scores plus exact Lipinski/Veber/Ghose checks. Docking runs a real AutoDock Vina calculation — you'll need a prepared receptor file for that one.",
  },
  {
    icon: BookOpen,
    title: "Literature & Experiments",
    body: "Literature search pulls live results straight from PubMed. The Experiments module tracks your real lab validation work.",
  },
  {
    icon: HeartPulse,
    title: "Clinical Recommendation & Reports",
    body: "Get transparent, documented trial-phase success estimates, then generate real PDF or Excel reports from your actual project data.",
  },
  {
    icon: Sparkles,
    title: "Ask the Assistant",
    body: "The chat bubble in the corner can answer questions about the platform, your data, or check whether anything's currently down — click it any time.",
  },
];

export default function TutorialOverlay({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setStep(0);
      return;
    }
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [forceOpen]);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    onClose?.();
  }

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-white border border-surface-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Icon size={20} />
            </div>
            <button onClick={finish} className="text-ink-500 hover:text-white transition-colors" aria-label="Skip tutorial">
              <X size={18} />
            </button>
          </div>

          <h2 className="font-display text-lg font-semibold text-white mb-2">{current.title}</h2>
          <p className="text-sm text-ink-500 leading-relaxed">{current.body}</p>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? "bg-emerald-500" : "bg-surface-border"}`} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={finish} className="text-sm text-ink-500 hover:text-white transition-colors">
              Skip
            </button>
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="bg-navy-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
