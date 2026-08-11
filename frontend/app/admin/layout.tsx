"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isError) {
      router.replace("/login");
      return;
    }
    // Client-side redirect for a clean UX; the actual security boundary is
    // require_role(Role.ADMIN) on every /admin/* backend route, which
    // rejects non-admins regardless of what the frontend does.
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, isError, router]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-surface-gray flex items-center justify-center">
        <p className="text-sm text-ink-500 font-mono">Checking access…</p>
      </div>
    );
  }

  return (
    <div className="flex bg-surface-gray min-h-screen">
      <AdminSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
