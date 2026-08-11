"use client";

import { useState } from "react";
import Link from "next/link";
import { useLogin } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-surface-white">
      <div className="hidden lg:flex flex-col justify-between bg-navy-950 text-white p-12 bg-lab-grid">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-lg">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          NovaGen
        </Link>
        <div>
          <p className="font-display text-3xl font-semibold leading-tight max-w-md">
            One platform for the entire discovery pipeline.
          </p>
          <p className="text-white/60 mt-4 max-w-sm text-sm leading-relaxed">
            Disease identification through clinical recommendation — all traceable, all in one place.
          </p>
        </div>
        <p className="text-xs text-white/40 font-mono">© {new Date().getFullYear()} NovaGen AI</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Sign in</h1>
          <p className="text-sm text-ink-500 mb-8">Welcome back to your research workspace.</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate({ email, password });
            }}
          >
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
                placeholder="you@lab.org"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
                placeholder="••••••••"
              />
            </div>

            {login.isError && (
              <p className="text-sm text-red-400">Invalid email or password. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-navy-900 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-ink-300">
            <div className="h-px flex-1 bg-surface-border" />
            or continue with
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="border border-surface-border rounded-lg py-2.5 text-sm font-medium hover:bg-surface-gray transition-colors">
              Google
            </button>
            <button className="border border-surface-border rounded-lg py-2.5 text-sm font-medium hover:bg-surface-gray transition-colors">
              Microsoft
            </button>
          </div>

          <p className="mt-8 text-sm text-ink-500">
            No account?{" "}
            <Link href="/register" className="text-white/90 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
