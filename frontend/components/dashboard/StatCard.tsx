import { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}) {
  return (
    <div className="bg-surface-white rounded-xl border border-surface-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-navy-950/5 flex items-center justify-center text-white/90">
          <Icon size={18} />
        </div>
        {trend && <span className="text-xs font-mono text-emerald-400">{trend}</span>}
      </div>
      <p className="font-display text-2xl font-semibold text-white">{value}</p>
      <p className="text-xs text-ink-500 mt-1">{label}</p>
    </div>
  );
}
