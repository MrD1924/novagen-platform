"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Dna, Target, FlaskConical, BrainCircuit, Microscope, HeartPulse, FileBarChart } from "lucide-react";
import Reveal from "./Reveal";

const STAGES = [
  { icon: Dna, title: "Disease Identification", desc: "Ontology, biomarkers, gene & pathway analysis" },
  { icon: Target, title: "Target Identification", desc: "Protein structures, binding sites, druggability" },
  { icon: FlaskConical, title: "Molecule Screening", desc: "Virtual screening & similarity search" },
  { icon: BrainCircuit, title: "AI Prediction", desc: "Binding affinity, ADMET, toxicity, efficacy" },
  { icon: Microscope, title: "Lab Validation", desc: "Experiment planning & quality control" },
  { icon: HeartPulse, title: "Clinical Recommendation", desc: "Cohorts, trial suggestions, risk analysis" },
  { icon: FileBarChart, title: "Reporting", desc: "Scientific reports, charts, visual analytics" },
];

export default function WorkflowPipeline() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="workflow" className="bg-surface-gray py-24">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">Drug discovery workflow</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              One pipeline, seven stages, zero handoffs.
            </h2>
            <p className="mt-4 text-ink-500 leading-relaxed">
              Every module below runs on the same underlying data — a compound identified in
              screening carries its lineage all the way to the clinical recommendation report.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-7 gap-3">
          {STAGES.map((stage, i) => {
            const isActive = i === active;
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.title}
                className={`relative rounded-xl border p-4 cursor-pointer transition-colors ${
                  isActive ? "border-emerald-500 bg-surface-white shadow-md" : "border-surface-border bg-surface-white/60 hover:bg-surface-white"
                }`}
                onClick={() => setActive(i)}
                animate={isActive ? { y: -4 } : { y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                    isActive ? "bg-emerald-500 text-white" : "bg-navy-950/5 text-white/90"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <p className="text-xs font-mono text-ink-300 mb-1">{`0${i + 1}`}</p>
                <p className="font-medium text-sm text-white leading-snug">{stage.title}</p>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-ink-500 mt-2 leading-relaxed"
                  >
                    {stage.desc}
                  </motion.p>
                )}

                {i < STAGES.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-3 h-px bg-surface-border" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
