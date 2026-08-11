"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Microscope, Plus } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { experimentService } from "@/services/domain";

const STATUS_STYLES: Record<string, string> = {
  planned: "bg-ink-300/10 text-ink-500",
  in_progress: "bg-emerald-500/10 text-emerald-300",
  completed: "bg-navy-950/5 text-white/90",
  failed: "bg-red-500/10 text-red-300",
  cancelled: "bg-ink-300/10 text-ink-300",
};

export default function ExperimentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["experiments"],
    queryFn: async () => (await experimentService.list()).data,
  });

  const create = useMutation({
    mutationFn: async () => experimentService.create({ project_id: projectId, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      setShowForm(false);
      setTitle("");
      setProjectId("");
    },
  });

  return (
    <>
      <Topbar title="Experiments" />
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-500 flex items-center gap-2">
            <Microscope size={15} /> Laboratory validation — plan, track, and record results
          </p>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <Plus size={16} /> New experiment
          </button>
        </div>

        {showForm && (
          <div className="bg-surface-white rounded-xl border border-surface-border p-5">
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <input
                placeholder="Experiment title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
              />
              <input
                placeholder="Project ID (UUID)"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="rounded-lg border border-surface-border px-4 py-2.5 text-sm font-mono focus:border-navy-900 outline-none"
              />
            </div>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !title || !projectId}
              className="bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create experiment"}
            </button>
            {create.isError && <p className="text-sm text-red-400 mt-2">Could not create experiment — check the project ID is a valid UUID.</p>}
          </div>
        )}

        <div className="bg-surface-white rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-gray text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Title</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={2} className="px-5 py-6 text-center text-ink-300 text-sm">Loading…</td></tr>
              )}
              {!isLoading && (!data || data.length === 0) && (
                <tr><td colSpan={2} className="px-5 py-6 text-center text-ink-300 text-sm">No experiments yet. Plan your first one above.</td></tr>
              )}
              {(data ?? []).map((exp: { id: string; title: string; status: string }) => (
                <tr key={exp.id} className="border-t border-surface-border">
                  <td className="px-5 py-3 text-white">{exp.title}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[exp.status] ?? ""}`}>
                      {exp.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
