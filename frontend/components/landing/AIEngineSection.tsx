import MolecularWorkspace from "@/components/animations/MolecularWorkspace";
import Reveal from "./Reveal";

const METRICS = [
  ["Binding affinity", "RandomForest ensemble over RDKit descriptors, pIC50 output"],
  ["ADMET", "Absorption, distribution, metabolism, excretion, toxicity scoring"],
  ["Toxicity", "Structure-based liability screening before a compound reaches the bench"],
  ["Generative molecules", "BRICS-based fragment recombination scored against ADMET in real time"],
];

export default function AIEngineSection() {
  return (
    <section id="ai-engine" className="py-24 bg-surface-gray">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <div>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">AI prediction engine</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-6">
              Every compound, scored on four axes before it's synthesized.
            </h2>
            <dl className="space-y-5">
              {METRICS.map(([term, desc]) => (
                <div key={term} className="flex gap-4">
                  <div className="w-1 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <dt className="font-medium text-white text-sm">{term}</dt>
                    <dd className="text-sm text-ink-500 mt-1 leading-relaxed">{desc}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
        <Reveal delay={0.15} y={30}>
          <MolecularWorkspace />
        </Reveal>
      </div>
    </section>
  );
}
