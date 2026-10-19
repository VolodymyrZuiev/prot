import { useEffect, useMemo, useState } from "react";
import { Minus, Search, X } from "lucide-react";
import { uid } from "../data";
import { useStore } from "../store";
import { btnPrimary } from "./ui";

export function QuoteRulesModal() {
  const store = useStore();
  const [tab, setTab] = useState("include");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(store.quoteRules);

  useEffect(() => {
    if (!store.quoteRulesOpen) return;
    setDraft({
      include: store.quoteRules.include.map((row) => ({ ...row })),
      exclude: store.quoteRules.exclude.map((row) => ({ ...row })),
    });
    setTab("include");
    setQuery("");
  }, [store.quoteRulesOpen, store.quoteRules]);

  useEffect(() => {
    if (!store.quoteRulesOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") store.setQuoteRulesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  const rows = draft[tab] || [];
  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!needle) return rows;
    return rows.filter((row) => `${row.company} ${row.email}`.toLowerCase().includes(needle));
  }, [rows, needle]);

  const knownBrokers = useMemo(() => {
    const byEmail = new Map();
    for (const quote of store.quotes) {
      const email = quote.email?.trim();
      if (!email || byEmail.has(email.toLowerCase())) continue;
      byEmail.set(email.toLowerCase(), { company: quote.company, email });
    }
    return [...byEmail.values()];
  }, [store.quotes]);

  const pending = useMemo(() => draftFromQuery(query, rows, knownBrokers), [query, rows, knownBrokers]);

  if (!store.quoteRulesOpen) return null;

  const remove = (id) => {
    setDraft((current) => ({
      ...current,
      [tab]: current[tab].filter((row) => row.id !== id),
    }));
  };

  const addNew = () => {
    if (!pending) return;
    setDraft((current) => ({
      ...current,
      [tab]: [{ id: uid("rule"), company: pending.company, email: pending.email }, ...current[tab]],
    }));
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" onMouseDown={() => store.setQuoteRulesOpen(false)}>
      <div
        role="dialog"
        aria-labelledby="quote-rules-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="modal-pop flex max-h-[88vh] w-full max-w-[720px] flex-col rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between px-6 pt-5">
          <h2 id="quote-rules-title" className="text-[20px] font-semibold">
            Quote Rules
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => store.setQuoteRulesOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 px-6 py-4">
          <div className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200">
            <div className="px-4 pt-4">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addNew();
                    }
                  }}
                  placeholder="Company or email"
                  className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400"
                />
                {pending && (
                  <button type="button" onClick={addNew} className="shrink-0 text-[13px] font-semibold text-[#2f6cf6]">
                    Add
                  </button>
                )}
              </label>
              <div className="mt-3 flex gap-5 border-b border-transparent text-[14px]">
                <TabButton active={tab === "include"} onClick={() => setTab("include")}>
                  Always include
                </TabButton>
                <TabButton active={tab === "exclude"} onClick={() => setTab("exclude")}>
                  Exclude
                </TabButton>
              </div>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left text-[13px]">
                <thead className={tab === "exclude" ? "bg-[#fdecec]" : "bg-white"}>
                  <tr className="text-[12px] text-slate-500">
                    <th className="w-12 px-4 py-2.5 font-medium">#</th>
                    <th className="px-2 py-2.5 font-medium">Company name</th>
                    <th className="px-2 py-2.5 font-medium">Email</th>
                    <th className="w-24 px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-slate-400">
                        {pending ? (
                          <button type="button" onClick={addNew} className="font-semibold text-[#2f6cf6]">
                            Add {pending.company}
                            {pending.email ? ` · ${pending.email}` : ""}
                          </button>
                        ) : (
                          "No companies match this search."
                        )}
                      </td>
                    </tr>
                  ) : (
                    visible.map((row, index) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 text-slate-400">{index + 1}</td>
                        <td className="px-2 py-2.5">{row.company}</td>
                        <td className="px-2 py-2.5 text-slate-600">{row.email || "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            aria-label={`Remove ${row.company}`}
                            onClick={() => remove(row.id)}
                            className="inline-grid h-6 w-6 place-items-center rounded-full border border-[#ef4444] text-[#ef4444] hover:bg-[#fff1f1]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 pb-5">
          <button type="button" onClick={() => store.setQuoteRulesOpen(false)} className="text-[13px] font-medium text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          <button type="button" onClick={() => store.saveQuoteRules(draft)} className={btnPrimary}>
            Save
          </button>
        </footer>
      </div>
    </div>
  );
}

function draftFromQuery(query, rows, knownBrokers) {
  const value = query.trim();
  if (!value) return null;
  const lower = value.toLowerCase();
  const taken = rows.some((row) => row.company.toLowerCase() === lower || row.email.toLowerCase() === lower);
  if (taken) return null;

  const known = knownBrokers.find((broker) => broker.company.toLowerCase() === lower || broker.email.toLowerCase() === lower);
  if (known && !rows.some((row) => row.email.toLowerCase() === known.email.toLowerCase())) return known;

  if (value.includes("@")) {
    const local = value.split("@")[0].replace(/[._-]+/g, " ").trim();
    const company = local.replace(/\b\w/g, (char) => char.toUpperCase()) || value;
    return { company, email: value };
  }

  return { company: value, email: "" };
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 pb-2 font-medium ${active ? "border-[#2f6cf6] text-[#2f6cf6]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
    >
      {children}
    </button>
  );
}
