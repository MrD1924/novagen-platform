"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  FlaskConical,
  BrainCircuit,
  Microscope,
  FileBarChart,
  BookOpen,
  Layers,
  HeartPulse,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useLogout } from "@/hooks/useAuth";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/targets", label: "Target Identification", icon: Target },
  { href: "/dashboard/screening", label: "Molecule Screening", icon: FlaskConical },
  { href: "/dashboard/predictions", label: "AI Predictions", icon: BrainCircuit },
  { href: "/dashboard/docking", label: "Docking", icon: Layers },
  { href: "/dashboard/literature", label: "Literature", icon: BookOpen },
  { href: "/dashboard/experiments", label: "Experiments", icon: Microscope },
  { href: "/dashboard/clinical", label: "Clinical Recommendation", icon: HeartPulse },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="w-64 shrink-0 border-r border-surface-border bg-surface-white flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-surface-border">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-white/90">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          NovaGen
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
                active ? "bg-navy-950/5 text-white/90 font-medium" : "text-ink-500 hover:bg-surface-gray hover:text-white/90"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-border space-y-1">
        <Link href="/dashboard/notifications" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-500 hover:bg-surface-gray hover:text-white/90">
          <Bell size={17} /> Notifications
        </Link>
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-500 hover:bg-surface-gray hover:text-white/90">
          <Settings size={17} /> Settings
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-500 hover:bg-surface-gray hover:text-white/90">
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  );
}
