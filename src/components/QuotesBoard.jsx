import { useMemo, useState } from "react";
import { Archive, Calendar, ChevronDown, ExternalLink, Search, Tag, X } from "lucide-react";
import { useStore } from "../store";
import { EmailLines, StatusMarks, btnGhost, btnPrimary, btnSoft, quoteOpensDirectly } from "./ui";

const STATUS_OPTIONS = [
  { id: "new-active", label: "New/active" },
  { id: "new", label: "New only" },
  { id: "offer", label: "Offer created" },
  { id: "bid", label: "BID created" },
];

const DATE_OPTIONS = [
  { id: "all", label: "Any date" },
  { id: "2020", label: "2020" },
  { id: "2025", label: "2025" },
];

export function QuotesBoard() {
  const store = useStore();
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const newCount = store.quotes.filter((quote) => !quote.archived && quote.isNew && quote.department === store.department).length;

  const visible = useMemo(() => {
    return store.quotes.filter((quote) => {
      if (quote.department !== store.department) return false;
      if (store.tab === "active" ? quote.archived : !quote.archived) return false;
      if (store.otrOnly && quote.equipment !== "OTR") return false;
      if (store.statusFilter === "new" && !quote.isNew) return false;
      if (store.statusFilter === "offer" && !quote.offerCreated) return false;
      if (store.statusFilter === "bid" && !quote.bidCreated) return false;
      if (store.dateFilter !== "all" && !quote.timestamp.startsWith(store.dateFilter)) return false;
      const needle = store.query.trim().toLowerCase();
      if (!needle) return true;
      const haystack = [quote.company, quote.contact, quote.email, quote.lane, quote.number, quote.body.map((line) => line.value).join(" ")]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [store.quotes, store.department, store.tab, store.otrOnly, store.statusFilter, store.dateFilter, store.query]);

  const statusLabel = STATUS_OPTIONS.find((option) => option.id === store.statusFilter)?.label;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h1 className="text-[28px] font-semibold tracking-tight text-[#1c2434]">Quotes</h1>
      <div className="mt-2 flex items-end gap-2">
        <button
          type="button"
          onClick={() => store.setTab("active")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-semibold ${
            store.tab === "active" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Active
          {newCount > 0 && (
            <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold text-white">
              {newCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => store.setTab("archive")}
          className={`rounded-xl px-4 py-2 text-[14px] font-semibold ${
            store.tab === "archive" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Archive
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setStatusOpen((open) => !open);
              setDateOpen(false);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm"
          >
            {statusLabel}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {statusOpen && (
            <Menu
              onClose={() => setStatusOpen(false)}
              options={STATUS_OPTIONS}
              value={store.statusFilter}
              onPick={store.setStatusFilter}
            />
          )}
        </div>
        <label className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm sm:max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={store.query}
            onChange={(event) => store.setQuery(event.target.value)}
            placeholder="broker email"
            className="h-full w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
          />
          {store.query && (
            <button type="button" aria-label="Clear search" onClick={() => store.setQuery("")}>
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
        </label>
        <div className="relative">
          <button
            type="button"
            aria-label="Date filter"
            onClick={() => {
              setDateOpen((open) => !open);
              setStatusOpen(false);
            }}
            className={`grid h-10 w-10 place-items-center rounded-xl border bg-white shadow-sm ${
              store.dateFilter === "all" ? "border-slate-200 text-slate-500" : "border-[#2f6cf6] text-[#2f6cf6]"
            }`}
          >
            <Calendar className="h-4 w-4" />
          </button>
          {dateOpen && (
            <Menu
              onClose={() => setDateOpen(false)}
              options={DATE_OPTIONS}
              value={store.dateFilter}
              onPick={store.setDateFilter}
              align="right"
            />
          )}
        </div>
        {store.otrOnly && (
          <button
            type="button"
            onClick={() => store.setOtrOnly(false)}
            className="inline-flex h-10 items-center gap-1 rounded-xl bg-[#e9f9ee] px-3 text-[13px] font-medium text-[#1f9d45]"
          >
            OTR only
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <span className="ml-auto text-[12px] text-slate-400">{visible.length} quotes</span>
      </div>

      <div className="scroll-thin mt-4 min-h-0 flex-1 overflow-auto pr-1">
        {visible.length === 0 ? (
          <Empty
            onReset={() => {
              store.setQuery("");
              store.setStatusFilter("new-active");
              store.setDateFilter("all");
              store.setOtrOnly(false);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} archivedView={store.tab === "archive"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteCard({ quote, archivedView }) {
  const store = useStore();
  const openDirect = quoteOpensDirectly(quote);

  return (
    <article className="flex min-h-[280px] flex-col rounded-2xl border border-[#e6ebf2] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <header className="flex items-start justify-between gap-2">
        <h2 className="min-w-0 text-[15px] font-semibold leading-5">{quote.company}</h2>
        <StatusMarks quote={quote} />
      </header>
      <div className="mt-2 text-[13px] text-slate-700">{quote.contact}</div>
      <a href={`mailto:${quote.email}`} className="text-[12.5px] text-[#2f6cf6] hover:underline">
        {quote.email}
      </a>
      <div className="mt-0.5 text-[12px] text-slate-400">{quote.timestamp}</div>
      <div className="mt-3 flex-1">
        <EmailLines lines={quote.body} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {archivedView ? (
          <button type="button" className={btnSoft} onClick={() => store.restoreQuote(quote.id)}>
            Restore
          </button>
        ) : openDirect ? (
          <button type="button" className={btnSoft} onClick={() => store.openWorkspace(quote.id)}>
            Open <ExternalLink className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button type="button" className={btnPrimary} onClick={() => store.openCheck(quote.id)}>
            Create BID & Offer <Tag className="h-3.5 w-3.5" />
          </button>
        )}
        {archivedView ? (
          <button type="button" className={btnGhost} onClick={() => store.openWorkspace(quote.id)}>
            Open
          </button>
        ) : (
          <button type="button" className={btnGhost} onClick={() => store.archiveQuote(quote.id)}>
            <Archive className="h-3.5 w-3.5" /> Archive
          </button>
        )}
      </div>
    </article>
  );
}

function Menu({ options, value, onPick, onClose, align = "left" }) {
  return (
    <>
      <button type="button" className="fixed inset-0 z-20 cursor-default" onClick={onClose} aria-label="Close menu" />
      <div className={`absolute top-11 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              onPick(option.id);
              onClose();
            }}
            className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-slate-50 ${option.id === value ? "font-semibold text-[#2f6cf6]" : "text-slate-700"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}

function Empty({ onReset }) {
  return (
    <div className="grid h-full min-h-[280px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60">
      <div className="text-center">
        <div className="text-sm font-semibold">No quotes match these filters</div>
        <p className="mt-1 text-[13px] text-slate-500">Try another department, date, or search.</p>
        <button type="button" onClick={onReset} className="mt-3 text-[13px] font-semibold text-[#2f6cf6]">
          Clear filters
        </button>
      </div>
    </div>
  );
}
