"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/domain";
import { Bell } from "lucide-react";

export default function NotificationsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await notificationService.list()).data,
  });

  return (
    <div className="bg-surface-white rounded-xl border border-surface-border p-5">
      <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <Bell size={15} /> Notifications
      </p>
      {isLoading && <p className="text-xs text-ink-300">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <p className="text-xs text-ink-300">You're all caught up — nothing new right now.</p>
      )}
      <ul className="space-y-3">
        {(data ?? []).slice(0, 6).map((n: { id: string; title: string; body?: string; is_read: boolean }) => (
          <li key={n.id} className="flex items-start gap-2.5">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.is_read ? "bg-surface-border" : "bg-emerald-500"}`} />
            <div>
              <p className="text-sm text-white leading-snug">{n.title}</p>
              {n.body && <p className="text-xs text-ink-500 mt-0.5">{n.body}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
