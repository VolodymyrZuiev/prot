import { useEffect, useMemo, useState } from "react";
import { Minus, Search, X } from "lucide-react";
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
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.company} ${row.email}`.toLowerCase().includes(needle));
  }, [rows, query]);

  if (!store.quoteRulesOpen) return null;

  const remove = (id) => {
    setDraft((current) => ({
      ...current,
      [tab]: current[tab].filter((row) => row.id !== id),
    }));
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
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by company / email"
                  className="h-full w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
                />
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
                        No companies match this search.
                      </td>
                    </tr>
                  ) : (
                    visible.map((row, index) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 text-slate-400">{index + 1}</td>
                        <td className="px-2 py-2.5">{row.company}</td>
                        <td className="px-2 py-2.5 text-slate-600">{row.email}</td>
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
