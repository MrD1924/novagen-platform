"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Topbar from "@/components/dashboard/Topbar";
import { adminService } from "@/services/domain";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization: string | null;
  is_active: boolean;
  created_at: string;
};

const ROLES = ["researcher", "scientist", "doctor", "laboratory", "admin", "pharma"];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await adminService.listUsers()).data as AdminUser[],
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { role?: string; is_active?: boolean } }) =>
      (await adminService.updateUser(id, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <>
      <Topbar title="Users" />
      <div className="p-8">
        <div className="bg-surface-white rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-gray text-left text-xs text-ink-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
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
              {!isLoading && (users ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-ink-500">
                    No users found.
                  </td>
                </tr>
              )}
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 text-white font-medium">{u.full_name}</td>
                  <td className="px-5 py-3 text-ink-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => update.mutate({ id: u.id, payload: { role: e.target.value } })}
                      className="bg-surface-gray border border-surface-border rounded-md px-2 py-1 text-sm capitalize"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => update.mutate({ id: u.id, payload: { is_active: !u.is_active } })}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        u.is_active
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}
                    >
                      {u.is_active ? "Active" : "Deactivated"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-ink-500">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
