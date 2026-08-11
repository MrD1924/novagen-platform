"use client";

import { useState } from "react";
import Link from "next/link";
import { useRegister } from "@/hooks/useAuth";

const ROLES = [
  { value: "researcher", label: "Researcher" },
  { value: "scientist", label: "Scientist" },
  { value: "doctor", label: "Doctor" },
  { value: "laboratory", label: "Laboratory" },
  { value: "pharma", label: "Pharma company" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "researcher", organization: "" });
  const register = useRegister();

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-gray p-8">
      <div className="w-full max-w-md bg-surface-white border border-surface-border rounded-2xl p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-lg text-white/90 mb-6">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          NovaGen
        </Link>

        <h1 className="font-display text-2xl font-semibold text-white mb-1">Create your account</h1>
        <p className="text-sm text-ink-500 mb-6">Start a research workspace in a minute.</p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            register.mutate(form);
          }}
        >
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Full name</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Work email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none bg-surface-white"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Organization</label>
            <input
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-4 py-2.5 text-sm focus:border-navy-900 outline-none"
            />
          </div>

          {register.isError && <p className="text-sm text-red-400">Could not create account. That email may already be registered.</p>}

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full bg-navy-900 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-60"
          >
            {register.isPending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-500 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-white/90 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
