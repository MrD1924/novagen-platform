"use client";

import { useCurrentUser } from "@/hooks/useAuth";

export default function Topbar({ title }: { title: string }) {
  const { data: user } = useCurrentUser();

  return (
    <header className="h-16 border-b border-surface-border bg-surface-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
      <h1 className="font-display text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-white leading-none">{user.full_name}</p>
              <p className="text-xs text-ink-500 mt-1 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-medium">
              {user.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
