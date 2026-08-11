"use client";

import { motion } from "framer-motion";
import TargetLockScene from "@/components/animations/TargetLockScene";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-lab-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-white via-surface-white/95 to-surface-gray pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
            Model inference live across 4 prediction engines
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.05] tracking-tight">
            From target to clinic,
            <br />
            <span className="text-gradient-scan">guided by AI.</span>
          </h1>

          <p className="mt-6 text-lg text-ink-500 max-w-xl leading-relaxed">
            NovaGen unifies disease identification, target discovery, molecule screening,
            and clinical recommendation into one research platform — so your team spends
            time on science, not on stitching tools together.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="/dashboard"
              className="bg-navy-900 text-white font-medium px-6 py-3 rounded-lg hover:bg-navy-800 transition-colors"
            >
              Start Research
            </a>
            <a
              href="/dashboard"
              className="border border-surface-border text-ink-900 font-medium px-6 py-3 rounded-lg hover:border-navy-900 transition-colors"
            >
              View Dashboard
            </a>
            <a href="#contact" className="text-white/90 font-medium px-2 py-3 hover:underline underline-offset-4">
              Book a demo →
            </a>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-6 max-w-md">
            {[
              ["12M+", "compounds indexed"],
              ["4", "prediction engines"],
              ["<200ms", "screening latency"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl font-semibold text-white/90">{value}</dt>
                <dd className="text-xs text-ink-500 mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        >
          <TargetLockScene />
        </motion.div>
      </div>
    </section>
  );
}
