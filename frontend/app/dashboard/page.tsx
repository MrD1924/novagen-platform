"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderKanban, FlaskConical, BrainCircuit, Beaker } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import PipelineProgressChart from "@/components/dashboard/PipelineProgressChart";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import RecentExperimentsPanel from "@/components/dashboard/RecentExperimentsPanel";
import { analyticsService } from "@/services/domain";

export default function DashboardOverview() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await analyticsService.summary()).data,
  });

  const { data: pipeline } = useQuery({
    queryKey: ["pipeline-progress"],
    queryFn: async () => (await analyticsService.pipelineProgress()).data,
  });

  return (
    <>
      <Topbar title="Overview" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderKanban} label="Active projects" value={summaryLoading ? "…" : summary?.total_projects ?? 0} />
          <StatCard icon={Beaker} label="Experiments in progress" value={summaryLoading ? "…" : summary?.active_experiments ?? 0} />
          <StatCard icon={BrainCircuit} label="Predictions (30d)" value={summaryLoading ? "…" : summary?.predictions_last_30d ?? 0} />
          <StatCard icon={FlaskConical} label="Compounds in library" value={summaryLoading ? "…" : summary?.compounds_in_library ?? 0} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PipelineProgressChart data={pipeline ?? []} />
          </div>
          <NotificationsPanel />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <RecentExperimentsPanel />
          <div className="bg-surface-white rounded-xl border border-surface-border p-5">
            <p className="text-sm font-medium text-white mb-2">Average prediction confidence</p>
            <p className="font-display text-4xl font-semibold text-emerald-400">
              {summaryLoading ? "…" : `${Math.round((summary?.average_prediction_confidence ?? 0) * 100)}%`}
            </p>
            <p className="text-xs text-ink-500 mt-2">Across all binding-affinity, ADMET, toxicity, and efficacy calls in the last 30 days.</p>
          </div>
        </div>
      </div>
    </>
  );
}
