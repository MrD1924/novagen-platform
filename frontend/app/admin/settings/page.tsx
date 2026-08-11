"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Topbar from "@/components/dashboard/Topbar";
import { useCurrentUser } from "@/hooks/useAuth";
import { profileService } from "@/services/domain";

const SERVICES = [
  ["gateway", 8000], ["auth", 8001], ["drug", 8002], ["prediction", 8003],
  ["analytics", 8004], ["experiment", 8005], ["report", 8006],
  ["notification", 8007], ["workflow", 8008], ["automation", 8009],
] as const;

function useServiceHealth() {
  return useQuery({
    queryKey: ["service-health"],
    queryFn: async () => {
      const results = await Promise.all(
        SERVICES.map(async ([name, port]) => {
          try {
            const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(3000) });
            return { name, port, ok: res.ok };
          } catch {
            return { name, port, ok: false };
          }
        })
      );
      return results;
    },
    refetchInterval: 15000,
  });
}

export default function AdminSettingsPage() {
  const { data: user } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const { data: health } = useServiceHealth();

  const save = useMutation({
    mutationFn: async () => (await profileService.update({ full_name: fullName || undefined, organization: organization || undefined })).data,
  });

  return (
    <>
      <Topbar title="Settings" />
      <div className="p-8 space-y-6 max-w-2xl">
        <div className="bg-surface-white rounded-xl border border-surface-border p-6">
          <h2 className="font-display text-base font-semibold text-white mb-4">Your profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Full name</label>
              <input
                defaultValue={user?.full_name}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-gray px-4 py-2.5 text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Organization</label>
              <input
                defaultValue={user?.organization ?? ""}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-gray px-4 py-2.5 text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="bg-amber-500 text-navy-950 font-medium px-5 py-2.5 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
            {save.isSuccess && <p className="text-sm text-emerald-400">Saved.</p>}
          </div>
        </div>

        <div className="bg-surface-white rounded-xl border border-surface-border p-6">
          <h2 className="font-display text-base font-semibold text-white mb-1">System status</h2>
          <p className="text-xs text-ink-500 mb-4">Live health check against every backend service, refreshed every 15s.</p>
          <div className="grid grid-cols-2 gap-2">
            {(health ?? SERVICES.map(([name, port]) => ({ name, port, ok: undefined }))).map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm bg-surface-gray rounded-lg px-3 py-2">
                <span className="capitalize text-ink-700">{s.name}-service</span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    s.ok === undefined
                      ? "text-ink-500"
                      : s.ok
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {s.ok === undefined ? "checking…" : s.ok ? "OK" : "DOWN"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
