"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, ScrollText, ShieldAlert } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { adminService } from "@/services/domain";

type AdminUser = { id: string; role: string; is_active: boolean };

export default function AdminOverviewPage() {
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await adminService.listUsers()).data as AdminUser[],
  });
  const { data: logs } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => (await adminService.listAuditLogs()).data as unknown[],
  });

  const total = users?.length ?? 0;
  const active = users?.filter((u) => u.is_active).length ?? 0;
  const admins = users?.filter((u) => u.role === "admin").length ?? 0;

  return (
    <>
      <Topbar title="Admin Overview" />
      <div className="p-8 space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700 leading-relaxed">
            You're in the admin console. Changes here — role changes, deactivations — affect real
            accounts platform-wide and are written to the audit log.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-surface-white rounded-xl border border-surface-border p-5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
              <Users size={17} />
            </div>
            <p className="text-2xl font-display font-semibold text-white">{total}</p>
            <p className="text-xs text-ink-500 mt-1">Total accounts ({active} active)</p>
          </div>
          <div className="bg-surface-white rounded-xl border border-surface-border p-5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
              <ShieldAlert size={17} />
            </div>
            <p className="text-2xl font-display font-semibold text-white">{admins}</p>
            <p className="text-xs text-ink-500 mt-1">Admin accounts</p>
          </div>
          <div className="bg-surface-white rounded-xl border border-surface-border p-5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
              <ScrollText size={17} />
            </div>
            <p className="text-2xl font-display font-semibold text-white">{logs?.length ?? 0}</p>
            <p className="text-xs text-ink-500 mt-1">Recent audit entries</p>
          </div>
        </div>
      </div>
    </>
  );
}
