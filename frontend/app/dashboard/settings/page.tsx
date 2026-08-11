"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, GraduationCap } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import TutorialOverlay from "@/components/dashboard/TutorialOverlay";
import { useCurrentUser } from "@/hooks/useAuth";
import { profileService } from "@/services/domain";

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setOrganization(user.organization ?? "");
    }
  }, [user]);

  const update = useMutation({
    mutationFn: () => profileService.update({ full_name: fullName, organization }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  return (
    <>
      <Topbar title="Settings" />
      <div className="p-8 max-w-lg">
        <div className="bg-surface-white rounded-xl border border-surface-border p-6">
          <p className="text-sm font-medium text-white mb-5 flex items-center gap-2">
            <Settings2 size={16} /> Profile
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Organization</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
              <input
                disabled
                value={user?.email ?? ""}
                className="w-full rounded-lg border border-surface-border bg-surface-gray px-4 py-2.5 text-sm text-ink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Role</label>
              <input
                disabled
                value={user?.role ?? ""}
                className="w-full rounded-lg border border-surface-border bg-surface-gray px-4 py-2.5 text-sm text-ink-500 capitalize"
              />
            </div>
          </div>

          <button
            onClick={() => update.mutate()}
            disabled={update.isPending}
            className="mt-6 bg-navy-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
          {update.isSuccess && <p className="text-sm text-emerald-400 mt-3">Saved.</p>}
        </div>

        <div className="bg-surface-white rounded-xl border border-surface-border p-6 mt-6">
          <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <GraduationCap size={16} /> Onboarding
          </p>
          <p className="text-sm text-ink-500 mb-4">Revisit the guided walkthrough of the platform's features.</p>
          <button
            onClick={() => setShowTutorial(true)}
            className="border border-surface-border text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:border-navy-900 transition-colors"
          >
            Replay tutorial
          </button>
        </div>
      </div>

      {showTutorial && <TutorialOverlay forceOpen onClose={() => setShowTutorial(false)} />}
    </>
  );
}
