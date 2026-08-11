"use client";

import { useState } from "react";

export default function AboutContact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="py-24 bg-surface-white border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
        <div>
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">About NovaGen</p>
          <h2 className="font-display text-3xl font-semibold text-white mb-5">Built for the scientists who ship, not just the ones who publish.</h2>
          <p className="text-ink-500 leading-relaxed mb-4">
            NovaGen was built to close the gap between a promising virtual-screening hit and a
            compound that actually reaches a bench, a trial, and eventually a patient. We built
            it as infrastructure a research team can run for years, not a demo.
          </p>
          <p className="text-ink-500 leading-relaxed">
            Currently used by academic labs, biotech teams, and pharma R&D groups running
            discovery pipelines end-to-end on a single platform.
          </p>
        </div>

        <div>
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">Book a demo</p>
          <h3 className="font-display text-2xl font-semibold text-white mb-6">Talk to the team.</h3>

          {submitted ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-300 text-sm">
              Thanks — we'll follow up within one business day.
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="Full name" className="w-full rounded-lg border border-surface-border px-4 py-3 text-sm focus:border-navy-900 outline-none" />
                <input required type="email" placeholder="Work email" className="w-full rounded-lg border border-surface-border px-4 py-3 text-sm focus:border-navy-900 outline-none" />
              </div>
              <input placeholder="Organization" className="w-full rounded-lg border border-surface-border px-4 py-3 text-sm focus:border-navy-900 outline-none" />
              <textarea placeholder="What are you researching?" rows={4} className="w-full rounded-lg border border-surface-border px-4 py-3 text-sm focus:border-navy-900 outline-none" />
              <button type="submit" className="bg-navy-900 text-white font-medium px-6 py-3 rounded-lg hover:bg-navy-800 transition-colors">
                Request demo
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
