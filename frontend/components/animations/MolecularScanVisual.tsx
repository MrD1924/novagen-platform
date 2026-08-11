"use client";

/**
 * NovaGen's signature visual: a molecular structure being continuously "scanned"
 * by a sweeping line, evoking the platform's core act — an AI model reading a
 * structure and returning a prediction. This motif is reused (smaller, quieter)
 * at section dividers and loading states so it reads as the platform's mark,
 * not a one-off hero decoration.
 */
export default function MolecularScanVisual() {
  const helixNodes = Array.from({ length: 14 });

  return (
    <div className="relative h-[420px] w-full max-w-[480px] mx-auto" aria-hidden="true">
      {/* faint grid backdrop */}
      <div className="absolute inset-0 bg-lab-grid opacity-40 rounded-2xl" />

      {/* rotating helix */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin-slow" style={{ transformOrigin: "50% 50%" }}>
        <svg viewBox="0 0 300 400" className="w-64 h-80 overflow-visible">
          <defs>
            <linearGradient id="strandA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B3D91" />
              <stop offset="100%" stopColor="#123B7A" />
            </linearGradient>
            <linearGradient id="strandB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          {helixNodes.map((_, i) => {
            const y = 20 + i * 26;
            const phase = (i / helixNodes.length) * Math.PI * 2;
            const xA = 150 + Math.sin(phase) * 70;
            const xB = 150 - Math.sin(phase) * 70;
            return (
              <g key={i}>
                <line x1={xA} y1={y} x2={xB} y2={y} stroke="#CBD5E1" strokeWidth="1.5" />
                <circle cx={xA} cy={y} r="6" fill="url(#strandA)" />
                <circle cx={xB} cy={y} r="6" fill="url(#strandB)" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* sweeping scan line */}
      <div className="absolute inset-x-4 top-0 bottom-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent animate-scanline" />
      </div>

      {/* floating data readouts */}
      <div className="absolute top-6 left-0 font-mono text-[11px] text-emerald-400 bg-surface-white/90 border border-surface-border rounded px-2 py-1 shadow-sm animate-float">
        binding_affinity: 8.42
      </div>
      <div
        className="absolute bottom-10 right-0 font-mono text-[11px] text-white/90 bg-surface-white/90 border border-surface-border rounded px-2 py-1 shadow-sm animate-float"
        style={{ animationDelay: "1.5s" }}
      >
        admet_score: 0.91
      </div>
      <div
        className="absolute bottom-32 left-2 font-mono text-[11px] text-ink-500 bg-surface-white/90 border border-surface-border rounded px-2 py-1 shadow-sm animate-float"
        style={{ animationDelay: "3s" }}
      >
        confidence: 0.97
      </div>
    </div>
  );
}
