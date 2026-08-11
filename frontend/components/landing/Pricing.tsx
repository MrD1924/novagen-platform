import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Lab",
    price: "$0",
    period: "for academic teams",
    features: ["Up to 3 researchers", "10K compound screens / mo", "Standard prediction models", "Community support"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Research",
    price: "$2,400",
    period: "per month",
    features: ["Unlimited researchers", "Unlimited screening", "Full AI prediction suite", "Clinical recommendation module", "Priority support"],
    cta: "Start Research",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "for pharma & CROs",
    features: ["Dedicated deployment (VPC/on-prem)", "Custom model training", "SSO + advanced RBAC", "SLA & dedicated support"],
    cta: "Book a demo",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-surface-gray">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">Scaled to how you research.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 border ${
                tier.highlighted ? "border-navy-900 bg-navy-950 text-white shadow-xl" : "border-surface-border bg-surface-white"
              }`}
            >
              <p className={`text-sm font-mono uppercase tracking-widest ${tier.highlighted ? "text-emerald-400" : "text-emerald-400"}`}>
                {tier.name}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-3xl font-semibold">{tier.price}</span>
                <span className={`text-sm ${tier.highlighted ? "text-white/60" : "text-ink-500"}`}>{tier.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} className={`mt-0.5 shrink-0 ${tier.highlighted ? "text-emerald-400" : "text-emerald-400"}`} />
                    <span className={tier.highlighted ? "text-white/90" : "text-ink-700"}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-8 block text-center font-medium px-5 py-3 rounded-lg transition-colors ${
                  tier.highlighted ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-navy-900 text-white hover:bg-navy-800"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
