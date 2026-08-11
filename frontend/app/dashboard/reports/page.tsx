"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileBarChart, Download, Info } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { reportService, experimentService, clinicalService } from "@/services/domain";

type Experiment = { id: string; title: string; status: string };
type ClinicalTrial = { id: string; phase: string; success_prediction: number | null };

export default function ReportsPage() {
  const [title, setTitle] = useState("Pipeline Status Report");
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [includeExperiments, setIncludeExperiments] = useState(true);
  const [includeClinical, setIncludeClinical] = useState(true);

  const { data: experiments } = useQuery({
    queryKey: ["experiments"],
    queryFn: async () => (await experimentService.list()).data as Experiment[],
  });

  const { data: clinicalTrials } = useQuery({
    queryKey: ["clinical-trials"],
    queryFn: async () => (await clinicalService.list()).data as ClinicalTrial[],
  });

  const generate = useMutation({
    mutationFn: async () => {
      const sections = [];

      if (includeExperiments) {
        sections.push({
          heading: "Experiments",
          rows: [
            ["Title", "Status"],
            ...(experiments ?? []).map((e) => [e.title, e.status.replace("_", " ")]),
          ],
        });
      }

      if (includeClinical) {
        sections.push({
          heading: "Clinical Recommendations",
          rows: [
            ["Phase", "Success estimate"],
            ...(clinicalTrials ?? []).map((t) => [
              t.phase.replace("_", " "),
              t.success_prediction !== null ? `${Math.round(t.success_prediction * 100)}%` : "—",
            ]),
          ],
        });
      }

      if (sections.length === 0) {
        sections.push({ heading: "No data", rows: [["Note"], ["No experiments or clinical trials selected/available yet."]] });
      }

      return (await reportService.generate({ title, format, sections })).data;
    },
  });

  const hasNoData = (experiments ?? []).length === 0 && (clinicalTrials ?? []).length === 0;

  return (
    <>
      <Topbar title="Reports" />
      <div className="p-8 space-y-6">
        <div className="bg-navy-950/5 border border-surface-border rounded-xl p-4 flex gap-3">
          <Info size={18} className="text-white/90 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700 leading-relaxed">
            Reports pull your real experiment and clinical-recommendation data from the database — not a
            placeholder example. If a section looks empty, it's because you haven't created any of that
            data yet (try the Experiments or Clinical Recommendation pages first).
          </p>
        </div>

        <div className="bg-surface-white rounded-xl border border-surface-border p-5 space-y-4">
          <p className="text-sm font-medium text-white flex items-center gap-2">
            <FileBarChart size={16} /> Generate a scientific report
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
              placeholder="Report title"
            />
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "pdf" | "excel")}
              className="rounded-lg border border-surface-border px-4 py-2.5 text-sm bg-surface-white focus:border-navy-900 outline-none"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={includeExperiments} onChange={(e) => setIncludeExperiments(e.target.checked)} />
              Include experiments ({(experiments ?? []).length} found)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={includeClinical} onChange={(e) => setIncludeClinical(e.target.checked)} />
              Include clinical recommendations ({(clinicalTrials ?? []).length} found)
            </label>
          </div>

          {hasNoData && (
            <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              You don't have any experiments or clinical trials yet — the report will still generate, but
              its sections will be empty. Add some real data first for a meaningful report.
            </p>
          )}

          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="bg-navy-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
          >
            {generate.isPending ? "Generating…" : "Generate"}
          </button>
          {generate.isError && (
            <p className="text-sm text-red-400">
              Could not generate — check report-service and MinIO are both running.
            </p>
          )}
        </div>

        {generate.data && (
          <div className="bg-surface-white rounded-xl border border-emerald-500/30 bg-emerald-500/10/50 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{generate.data.title}</p>
              <p className="text-xs text-ink-500 mt-1">{generate.data.format.toUpperCase()} · generated just now</p>
            </div>
            <a
              href={generate.data.download_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
            >
              <Download size={15} /> Download
            </a>
          </div>
        )}
      </div>
    </>
  );
}
