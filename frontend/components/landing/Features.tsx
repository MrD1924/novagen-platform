import { Network, Database, ShieldCheck, LineChart, Boxes, GitBranch } from "lucide-react";
import Reveal from "./Reveal";

const FEATURES = [
  { icon: Network, title: "Microservices architecture", desc: "Nine independently-scalable services behind one gateway — screening, prediction, and reporting scale separately from each other." },
  { icon: Database, title: "Polyglot data layer", desc: "PostgreSQL for structured records, Neo4j for protein/pathway graphs, MongoDB for unstructured scientific documents." },
  { icon: Boxes, title: "Model registry", desc: "Every prediction is traceable to a versioned model with logged metrics — no more \"which checkpoint made this call?\"" },
  { icon: GitBranch, title: "Full pipeline lineage", desc: "A compound's path from screening hit to clinical recommendation is preserved end-to-end for audit and reproducibility." },
  { icon: LineChart, title: "Live lab analytics", desc: "Pipeline progress, model performance, and experiment status computed directly from production data, not a nightly export." },
  { icon: ShieldCheck, title: "Role-aware access", desc: "Researchers, scientists, doctors, lab staff, pharma partners, and admins each see exactly what their role needs." },
];

export default function Features() {
  return (
    <section id="platform" className="py-24 bg-surface-white">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">Platform architecture</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Built like a research instrument, not a demo.
            </h2>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-border rounded-2xl overflow-hidden border border-surface-border">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="bg-surface-white p-7 h-full hover:bg-surface-gray transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-navy-950/5 flex items-center justify-center mb-4 text-white/90">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-medium text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
