"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Message = { role: "user" | "bot"; text: string };

/** Keyword -> answer pairs sourced from the platform's own real Features,
 * Pricing, Security, and Workflow copy (see the corresponding landing
 * components) - not fabricated marketing filler, and not a wired-up LLM.
 * Being upfront about that tradeoff: this gives correct, real answers about
 * the actual product with zero external dependencies or API keys, at the
 * cost of not handling questions outside this list. Swap this for a real
 * backend LLM proxy route later if broader conversation is needed. */
const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["price", "pricing", "cost", "plan", "free"],
    answer:
      "NovaGen has three tiers: Lab (free, for academic teams — up to 3 researchers), Research ($2,400/mo — unlimited researchers and screening, full AI suite), and Enterprise (custom — dedicated deployment, SSO, SLA). Want details on a specific tier?",
  },
  {
    keywords: ["security", "secure", "hipaa", "soc", "compliance", "data"],
    answer:
      "NovaGen supports SSO, role-based access control across six user types, and dedicated VPC/on-prem deployment on the Enterprise tier. Check the Security section on this page for the full breakdown.",
  },
  {
    keywords: ["docking", "vina", "receptor"],
    answer:
      "Docking runs real AutoDock Vina calculations against a receptor you prepare as PDBQT — the platform doesn't guess structural biology decisions for you. It's one stage in the full discovery pipeline.",
  },
  {
    keywords: ["prediction", "ai model", "admet", "toxicity", "binding"],
    answer:
      "The AI Prediction Engine scores every compound on binding affinity, ADMET, toxicity, and efficacy, cross-checked against Lipinski/Veber/Ghose drug-likeness rules before synthesis.",
  },
  {
    keywords: ["workflow", "pipeline", "stage", "process"],
    answer:
      "One pipeline, seven stages: disease identification, target ID, molecule screening, AI prediction, lab validation, clinical recommendation, and reporting — all sharing the same underlying data, no handoffs between tools.",
  },
  {
    keywords: ["demo", "trial", "start", "sign up", "get started"],
    answer:
      "You can start free on the Lab tier right from this page, or book a live demo if you want a walkthrough first — both buttons are up in the hero section.",
  },
  {
    keywords: ["literature", "pubmed", "research paper"],
    answer:
      "Literature search pulls live results directly from NCBI's PubMed — real, current research tied to your compound data, not a static database.",
  },
  {
    keywords: ["contact", "email", "reach", "talk to"],
    answer: "You can reach the team through the contact section further down this page, or book a demo directly.",
  },
];

const FALLBACK =
  "I don't have a specific answer for that yet — try asking about pricing, security, the workflow, AI predictions, or docking. For anything else, the contact section below can connect you with the team.";

function findAnswer(input: string): string {
  const lower = input.toLowerCase();
  for (const entry of FAQ) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.answer;
  }
  return FALLBACK;
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! Ask me about pricing, security, the workflow, or any feature on this page." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const answer = findAnswer(text);
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: answer }]);
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 text-navy-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
        aria-label="Open support chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-3rem)] h-[440px] bg-surface-white border border-surface-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border bg-navy-950 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm font-medium text-white">NovaGen Support</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-emerald-500 text-navy-950" : "bg-surface-gray text-ink-700"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
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
              className="w-9 h-9 rounded-lg bg-emerald-500 text-navy-950 flex items-center justify-center shrink-0 hover:bg-emerald-400 transition-colors"
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
