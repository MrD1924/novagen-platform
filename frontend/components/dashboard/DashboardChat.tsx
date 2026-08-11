"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { chatService } from "@/services/domain";

type Message = { role: "user" | "bot"; text: string; source?: "sns_workbench" | "fallback" };

export default function DashboardChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Ask me about the platform, your data, or if something's not working." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await chatService.query(text);
      setMessages((m) => [...m, { role: "bot", text: res.data.answer, source: res.data.source }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Couldn't reach the backend just now — check that all services are running." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 text-navy-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
        aria-label="Open assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[460px] bg-surface-white border border-surface-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border bg-navy-950 flex items-center gap-2">
            <Sparkles size={15} className="text-emerald-400" />
            <p className="text-sm font-medium text-white">NovaGen Assistant</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%]">
                  <div
                    className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-emerald-500 text-navy-950" : "bg-surface-gray text-ink-700"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.source && (
                    <p className="text-[10px] text-ink-300 mt-1 font-mono">
                      {m.source === "sns_workbench" ? "via SNS Workbench" : "real-time system data"}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-ink-300 font-mono">thinking…</p>}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-surface-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question…"
              className="flex-1 bg-surface-gray border border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className="w-9 h-9 rounded-lg bg-emerald-500 text-navy-950 flex items-center justify-center shrink-0 hover:bg-emerald-400 transition-colors disabled:opacity-60"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
