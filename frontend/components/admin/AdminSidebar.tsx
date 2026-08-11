"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Users, ScrollText, Settings, LogOut, ArrowLeftRight } from "lucide-react";
import { useLogout } from "@/hooks/useAuth";

const NAV = [
  { href: "/admin", label: "Overview", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="w-64 shrink-0 border-r border-amber-500/20 bg-surface-white flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-amber-500/20">
        <Link href="/admin" className="flex items-center gap-2 font-display font-semibold text-white">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          NovaGen <span className="text-amber-400 font-mono text-xs tracking-widest">ADMIN</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "bg-amber-500/10 text-amber-300 font-medium" : "text-ink-500 hover:bg-surface-gray hover:text-white"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-amber-500/20 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-500 hover:bg-surface-gray hover:text-white"
        >
          <ArrowLeftRight size={17} /> Switch to workspace
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-500 hover:bg-surface-gray hover:text-white"
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  );
}
