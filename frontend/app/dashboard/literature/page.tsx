"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, ExternalLink } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { literatureService } from "@/services/domain";

type Article = {
  pmid: string;
  title: string;
  journal: string;
  pub_date: string;
  authors: string[];
  url: string;
};

export default function LiteraturePage() {
  const [query, setQuery] = useState("EGFR inhibitor non-small cell lung cancer");

  const search = useMutation({
    mutationFn: async () => (await literatureService.search(query, 15)).data as Article[],
  });

  return (
    <>
      <Topbar title="Literature" />
      <div className="p-8 space-y-6">
        <div className="bg-surface-white rounded-xl border border-surface-border p-5">
          <p className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <BookOpen size={16} /> PubMed search
          </p>
          <p className="text-xs text-ink-500 mb-4">
            Live results from NCBI's E-utilities — every article below is a real PubMed record fetched at search time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. EGFR inhibitor, target, disease, gene…"
              className="flex-1 rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
            />
            <button
              onClick={() => search.mutate()}
              disabled={search.isPending}
              className="bg-navy-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
            >
              {search.isPending ? "Searching…" : "Search PubMed"}
            </button>
          </div>
          {search.isError && (
            <p className="text-sm text-red-400 mt-3">
              PubMed lookup failed — NCBI may be rate-limiting; add an NCBI_API_KEY in .env to raise the limit.
            </p>
          )}
        </div>

        {search.data && (
          <div className="space-y-3">
            {search.data.length === 0 && (
              <p className="text-sm text-ink-300 bg-surface-white rounded-xl border border-surface-border p-5">
                No matching PubMed records for that query.
              </p>
            )}
            {search.data.map((article) => (
              <a
                key={article.pmid}
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="block bg-surface-white rounded-xl border border-surface-border p-5 hover:border-navy-900 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-white leading-snug">{article.title}</p>
                  <ExternalLink size={15} className="text-ink-300 shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-ink-500 mt-2">
                  {article.journal} · {article.pub_date} · PMID {article.pmid}
                </p>
                {article.authors.length > 0 && (
                  <p className="text-xs text-ink-300 mt-1">{article.authors.join(", ")}{article.authors.length >= 3 ? " et al." : ""}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
