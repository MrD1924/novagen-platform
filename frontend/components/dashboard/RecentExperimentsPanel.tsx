"use client";

import { useQuery } from "@tanstack/react-query";
import { experimentService } from "@/services/domain";
import { Microscope } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  planned: "bg-ink-300/10 text-ink-500",
  in_progress: "bg-emerald-500/10 text-emerald-300",
  completed: "bg-navy-950/5 text-white/90",
  failed: "bg-red-500/10 text-red-300",
  cancelled: "bg-ink-300/10 text-ink-300",
};

export default function RecentExperimentsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["experiments"],
    queryFn: async () => (await experimentService.list()).data,
  });

  return (
    <div className="bg-surface-white rounded-xl border border-surface-border p-5">
      <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <Microscope size={15} /> Recent experiments
      </p>
      {isLoading && <p className="text-xs text-ink-300">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <p className="text-xs text-ink-300">No experiments yet — plan one from the Experiments tab.</p>
      )}
      <ul className="space-y-3">
        {(data ?? []).slice(0, 6).map((exp: { id: string; title: string; status: string }) => (
          <li key={exp.id} className="flex items-center justify-between">
            <span className="text-sm text-white">{exp.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[exp.status] ?? ""} capitalize`}>
              {exp.status.replace("_", " ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
