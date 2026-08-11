import { HeartPulse, BarChart3, Lock, KeyRound, FileClock, ShieldAlert } from "lucide-react";

export default function ClinicalAnalyticsSecurity() {
  return (
    <>
      <section className="py-24 bg-surface-white border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-10">
          <div>
            <div className="w-10 h-10 rounded-lg bg-navy-950/5 flex items-center justify-center mb-4 text-white/90">
              <HeartPulse size={20} />
            </div>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">Clinical recommendation</p>
            <h3 className="font-display text-xl font-semibold text-white mb-3">From compound to cohort.</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              Patient cohort matching, trial-phase suggestions, success-probability estimates, and
              risk analysis — generated from the same prediction data that scored the compound in the first place.
            </p>
          </div>

          <div>
            <div className="w-10 h-10 rounded-lg bg-navy-950/5 flex items-center justify-center mb-4 text-white/90">
              <BarChart3 size={20} />
            </div>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">Analytics</p>
            <h3 className="font-display text-xl font-semibold text-white mb-3">Dashboards that read the database, not a slide deck.</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              Pipeline progress, model performance, and prediction confidence are computed live from
              production Postgres — what you see on the dashboard is what's actually true right now.
            </p>
          </div>

          <div>
            <div className="w-10 h-10 rounded-lg bg-navy-950/5 flex items-center justify-center mb-4 text-white/90">
              <Lock size={20} />
            </div>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">Security</p>
            <h3 className="font-display text-xl font-semibold text-white mb-3">Enterprise controls, by default.</h3>
            <ul className="text-sm text-ink-500 leading-relaxed space-y-2 mt-3">
              <li className="flex items-center gap-2"><KeyRound size={14} className="text-emerald-400 shrink-0" /> JWT + OAuth, role-based access control</li>
              <li className="flex items-center gap-2"><FileClock size={14} className="text-emerald-400 shrink-0" /> Full audit logging on every mutating action</li>
              <li className="flex items-center gap-2"><ShieldAlert size={14} className="text-emerald-400 shrink-0" /> Encryption in transit, secrets management, CSRF/CORS hardened</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
