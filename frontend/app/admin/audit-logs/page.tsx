"use client";

import { useQuery } from "@tanstack/react-query";
import Topbar from "@/components/dashboard/Topbar";
import { adminService } from "@/services/domain";

type AuditLog = {
  id: string;
  actor_email: string | null;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => (await adminService.listAuditLogs()).data as AuditLog[],
  });

  return (
    <>
      <Topbar title="Audit Logs" />
      <div className="p-8">
        <div className="bg-surface-white rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-gray text-left text-xs text-ink-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Resource</th>
                <th className="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-ink-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && (logs ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-ink-500">
                    No audit activity yet — actions like logins and admin changes will appear here as they happen.
                  </td>
                </tr>
              )}
              {(logs ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-3 text-ink-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-white">{log.actor_email ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-surface-gray border border-surface-border rounded px-2 py-1">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-500 font-mono text-xs">{log.resource}</td>
                  <td className="px-5 py-3 text-ink-500 font-mono text-xs max-w-xs truncate">
                    {Object.keys(log.metadata || {}).length > 0 ? JSON.stringify(log.metadata) : "—"}
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
