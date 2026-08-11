"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import Topbar from "@/components/dashboard/Topbar";
import { notificationService } from "@/services/domain";

type Notification = { id: string; title: string; body: string | null; is_read: boolean; created_at: string };

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications-full"],
    queryFn: async () => (await notificationService.list()).data as Notification[],
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-full"] }),
  });

  return (
    <>
      <Topbar title="Notifications" />
      <div className="p-8">
        <div className="bg-surface-white rounded-xl border border-surface-border divide-y divide-surface-border">
          {isLoading && <p className="p-5 text-sm text-ink-300">Loading…</p>}
          {!isLoading && (!data || data.length === 0) && (
            <div className="p-10 text-center text-ink-300">
              <Bell size={28} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">You're all caught up.</p>
            </div>
          )}
          {(data ?? []).map((n) => (
            <div key={n.id} className="p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.is_read ? "bg-surface-border" : "bg-emerald-500"}`} />
                <div>
                  <p className="text-sm text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-ink-500 mt-1">{n.body}</p>}
                  <p className="text-xs text-ink-300 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead.mutate(n.id)}
                  className="text-xs text-white/90 flex items-center gap-1 hover:underline shrink-0"
                >
                  <Check size={13} /> Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
