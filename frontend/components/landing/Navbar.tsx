"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "AI Engine", href: "#ai-engine" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface-white/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-display font-semibold text-lg text-white/90">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          NovaGen
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-ink-700 hover:text-white/90 transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-sm text-ink-700 hover:text-white/90 px-3 py-2">
            Sign in
          </a>
          <a
            href="/dashboard"
            className="text-sm font-medium bg-navy-900 text-white px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
          >
            View Dashboard
          </a>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-surface-border bg-surface-white px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="block text-sm text-ink-700">
              {link.label}
            </a>
          ))}
          <a href="/login" className="block text-sm text-ink-700 pt-2">
            Sign in
          </a>
          <a href="/dashboard" className="block text-sm font-medium text-white/90">
            View Dashboard
          </a>
        </div>
      )}
    </header>
  );
}
