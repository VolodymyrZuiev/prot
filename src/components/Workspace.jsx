import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  Flag,
  MapPin,
  Mic,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Star,
  Truck,
} from "lucide-react";
import { QUICK_REPLIES, formatMoney, lastPreview } from "../data";
import { useStore } from "../store";
import { EmailLines, GmailMark, btnGhost, btnPrimary } from "./ui";

export function Workspace() {
  const store = useStore();
  const quote = store.workspaceQuote;
  const [pane, setPane] = useState("drivers");
  if (!quote) return null;

  const quotes = store.quotes.filter((item) => (quote.archived ? item.archived : !item.archived) && item.department === quote.department);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={store.closeWorkspace} className="inline-flex items-center gap-1 text-[20px] font-semibold tracking-tight">
          <ChevronLeft className="h-5 w-5" />
          Quotes
        </button>
        <span className="text-[20px] font-medium text-slate-400">/ #{quote.number}</span>
        <button type="button" onClick={() => store.openCheck(quote.id)} className="ml-auto text-[13px] font-semibold text-[#2f6cf6]">
          Review quote
        </button>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-1 lg:hidden">
        {[
          ["quotes", "Quotes"],
          ["drivers", "Drivers"],
          ["chat", "Chat"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPane(id)}
            className={`h-8 rounded-full text-[12px] font-semibold ${pane === id ? "bg-[#2f6cf6] text-white" : "bg-white text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <section className={`${pane === "quotes" ? "flex" : "hidden"} min-h-0 w-full flex-col lg:flex lg:w-[340px] lg:shrink-0`}>
          <QuoteRail quotes={quotes} activeId={quote.id} />
        </section>
        <section className={`${pane === "drivers" ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col lg:flex`}>
          <DriverBoard quote={quote} onOpenChat={() => setPane("chat")} />
        </section>
        <section className={`${pane === "chat" ? "flex" : "hidden"} min-h-0 w-full flex-col lg:flex lg:w-[390px] lg:shrink-0`}>
          <DriverChat quote={quote} />
        </section>
      </div>
    </div>
  );
}

function QuoteRail({ quotes, activeId }) {
  const store = useStore();
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1">
      {quotes.map((quote) => {
        const active = quote.id === activeId;
        return (
          <article
            key={quote.id}
            ref={active ? activeRef : null}
            className={`rounded-2xl border bg-white p-3.5 shadow-sm ${active ? "border-[#2f6cf6] ring-2 ring-[#2f6cf6]/15" : "border-[#e6ebf2]"}`}
          >
            <button type="button" onClick={() => store.openWorkspace(quote.id)} className="w-full text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[14px] font-semibold">{quote.company}</div>
                <span className="flex shrink-0 items-center gap-1">
                  {quote.offerCreated && (
                    <span className="rounded-full border border-[#3dce5a] px-1.5 py-px text-[10px] font-semibold text-[#1f9d45]">Offer created</span>
                  )}
                  {quote.bidCreated && <span className="rounded-full bg-[#3dce5a] px-1.5 py-px text-[10px] font-semibold text-white">BID created</span>}
                  <GmailMark className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-1 text-[12.5px] text-slate-700">{quote.contact}</div>
              <div className="truncate text-[12px] text-[#2f6cf6]">{quote.email}</div>
              <div className="text-[11px] text-slate-400">{quote.timestamp}</div>
              {!active && <div className="mt-2 truncate text-[12.5px] text-slate-500">{quote.lane}</div>}
            </button>
            {active && (
              <div className="mt-3">
                <div className="scroll-thin max-h-[320px] space-y-3 overflow-auto pr-1">
                  {quote.thread.map((message) => (
                    <div key={message.id} className={message.from === "me" ? "rounded-xl bg-[#eef4ff] p-2.5" : ""}>
                      <div className="mb-1 text-[11px] text-slate-400">
                        {message.from === "me" ? "You" : message.name} · {message.time}
                      </div>
                      <EmailLines lines={message.body} />
                    </div>
                  ))}
                </div>
                <MessageBox
                  placeholder="Write a message"
                  onSend={(text) => store.sendCustomerMessage(quote.id, text)}
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function DriverBoard({ quote, onOpenChat }) {
  const store = useStore();
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [sort, setSort] = useState("asc");
  const [status, setStatus] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rateDraft, setRateDraft] = useState(quote.broadcast?.rate || "");

  useEffect(() => {
    setSearch("");
    setApplied("");
    setStatus("all");
    setShowArchived(false);
    setEditing(false);
    setRateDraft(quote.broadcast?.rate || "");
  }, [quote.id]);

  const drivers = quote.drivers || [];
  const activeCount = drivers.filter((driver) => driver.status !== "archived" && driver.status !== "booked").length;
  const bookedCount = drivers.filter((driver) => driver.status === "booked").length;

  const visible = useMemo(() => {
    const needle = applied.trim().toLowerCase();
    return drivers
      .filter((driver) => (showArchived ? driver.status === "archived" : driver.status !== "archived"))
      .filter((driver) => (status === "all" ? true : driver.status === status))
      .filter((driver) => {
        if (!needle) return true;
        return `${driver.code} ${driver.name} ${driver.state} ${driver.company} ${driver.location}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => (sort === "asc" ? a.milesAway - b.milesAway : b.milesAway - a.milesAway));
  }, [drivers, applied, sort, status, showArchived]);

  const checkedIds = visible.filter((driver) => driver.checked).map((driver) => driver.id);
  const allChecked = visible.length > 0 && checkedIds.length === visible.length;
  const timer = formatTimer(quote.offerTimer || 0);
  const mapsHref = quote.broadcast
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(quote.broadcast.pu)}&destination=${encodeURIComponent(quote.broadcast.del)}`
    : null;

  if (!quote.bidCreated || drivers.length === 0) {
    return (
      <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white">
        <div className="max-w-sm px-6 text-center">
          <Truck className="mx-auto h-8 w-8 text-slate-300" />
          <div className="mt-2 text-sm font-semibold">No driver offers yet</div>
          <p className="mt-1 text-[13px] text-slate-500">Check the lane and post a rate. Drivers will answer in this board.</p>
          <button type="button" className={`${btnPrimary} mt-4`} onClick={() => store.openCheck(quote.id)}>
            Create BID & Offer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e6ebf2] bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2.5">
        <label className="flex h-9 min-w-[160px] flex-1 items-center gap-2 rounded-full border border-slate-200 px-3">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setApplied(search);
            }}
            placeholder="CityName"
            className="w-full bg-transparent text-[13px] outline-none"
          />
        </label>
        <button type="button" className="h-9 rounded-full bg-[#2f6cf6] px-4 text-[13px] font-semibold text-white" onClick={() => setApplied(search)}>
          Search
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            setSearch("");
            setApplied("");
          }}
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 px-3 py-2 text-[12.5px]">
        <span className="font-semibold text-slate-700">{activeCount} Active Offers</span>
        <span className="font-semibold text-slate-700">{bookedCount} Booked Offers</span>
        <button type="button" className="font-semibold text-[#2f6cf6]" onClick={() => setShowArchived((value) => !value)}>
          {showArchived ? "Active" : "Archive"}
        </button>
        <button
          type="button"
          className="text-slate-500"
          onClick={() => {
            setSearch("");
            setApplied("");
            setStatus("all");
            setSort("asc");
            setShowArchived(false);
            store.setVisibleChecks(
              quote.id,
              drivers.map((driver) => driver.id),
              false
            );
            store.pushToast("Filters cleared");
          }}
        >
          Clear All
        </button>
      </div>

      <div className="border-b border-slate-100 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold">{visible.length} DRIVERS</span>
          <span className="rounded-full bg-[#3dce5a] px-1.5 text-[11px] font-bold text-white">{quote.notified || drivers.length}</span>
          <span className="text-[12px] text-slate-400">{quote.broadcast?.postedAt}</span>
          {mapsHref && (
            <a href={mapsHref} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-[#2f6cf6]">
              <MapPin className="h-3.5 w-3.5" /> Google Maps
            </a>
          )}
          <button type="button" onClick={() => store.renewOffer(quote.id)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#2f6cf6]">
            <RefreshCw className="h-3.5 w-3.5" /> Renew offer
          </button>
        </div>
        <div className="mt-2 grid gap-1 text-[12.5px] text-slate-600 sm:grid-cols-2">
          <div>
            <span className="font-semibold text-slate-800">PU:</span> {quote.broadcast?.pu} / {quote.broadcast?.puWhen}
          </div>
          <div>
            <span className="font-semibold text-slate-800">DEL:</span> {quote.broadcast?.del} / {quote.broadcast?.delWhen}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className={`text-[13px] font-semibold ${quote.offerTimer < 60 ? "text-amber-600" : "text-slate-500"}`}>{timer}</span>
          {quote.offerTimer === 0 && <span className="text-[12.5px] text-slate-400">No new drivers available</span>}
          {editing ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const rate = Number(rateDraft);
                if (!rate) return;
                store.updateOffer(quote.id, { ...(quote.broadcast || {}), rate });
                setEditing(false);
              }}
            >
              <input
                value={rateDraft}
                onChange={(event) => setRateDraft(event.target.value)}
                className="h-8 w-24 rounded-full border border-slate-200 px-3 text-[13px]"
              />
              <button type="submit" className="text-[12px] font-semibold text-[#2f6cf6]">
                Save
              </button>
              <button type="button" className="text-[12px] text-slate-400" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button type="button" className={btnGhost} onClick={() => setEditing(true)}>
              Update offer
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 text-[12px] text-slate-500">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={() =>
              store.setVisibleChecks(
                quote.id,
                visible.map((driver) => driver.id),
                !allChecked
              )
            }
          />
          Choose All
        </label>
        <button type="button" className="inline-flex items-center gap-1 font-medium" onClick={() => setSort((value) => (value === "asc" ? "desc" : "asc"))}>
          <ArrowUpDown className="h-3.5 w-3.5" /> Mi away
        </button>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="ml-auto h-7 rounded-lg border border-slate-200 bg-white px-2 text-[12px]">
          <option value="all">Status</option>
          <option value="bidding">Bidding</option>
          <option value="accepted">Accepted</option>
          <option value="hold">On hold</option>
          <option value="booked">Booked</option>
        </select>
      </div>

      {checkedIds.length > 0 && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f4f8ff] px-3 py-2">
          <span className="text-[12px] text-slate-600">{checkedIds.length} selected</span>
          <button
            type="button"
            className="text-[12px] font-semibold text-[#2f6cf6]"
            onClick={() => checkedIds.forEach((id) => store.bookDriver(quote.id, id))}
          >
            Book selected
          </button>
          <button type="button" className="text-[12px] font-semibold text-slate-500" onClick={() => store.archiveDrivers(quote.id, checkedIds)}>
            Archive selected
          </button>
          {showArchived && (
            <button type="button" className="text-[12px] font-semibold text-[#1f9d45]" onClick={() => store.restoreDrivers(quote.id, checkedIds)}>
              Restore
            </button>
          )}
        </div>
      )}

      <div className="scroll-thin min-h-0 flex-1 overflow-auto">
        {visible.length === 0 && <div className="px-4 py-10 text-center text-[13px] text-slate-400">No drivers in this view.</div>}
        {visible.map((driver) => {
          const selected = quote.selectedDriverId === driver.id;
          const preview = lastPreview(driver);
          return (
            <div
              key={driver.id}
              className={`flex gap-2 border-b border-slate-100 px-3 py-2.5 ${selected ? "bg-[#f3f7ff]" : "hover:bg-slate-50"}`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={driver.checked}
                onChange={() => store.toggleDriverCheck(quote.id, driver.id)}
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  store.selectDriver(quote.id, driver.id);
                  onOpenChat();
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                    {driver.name.slice(0, 1)}
                  </span>
                  <span className="truncate text-[13px] font-semibold">
                    {driver.code} {driver.name}
                  </span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-[12px] text-slate-500">{driver.rating.toFixed(2)}</span>
                  {driver.badge && <span className="rounded bg-[#ff3b30] px-1 text-[10px] font-bold text-white">{driver.badge}</span>}
                </div>
                <div className="mt-0.5 pl-8 text-[12px] text-slate-400">{driver.milesAway} mi away</div>
                {driver.status === "hold" && <div className="pl-8 text-[12px] text-amber-600">Hold by {driver.holdBy}</div>}
                {driver.status === "accepted" && <div className="pl-8 text-[12px] text-sky-600">Driver accepted offer</div>}
                {driver.status === "booked" && <div className="pl-8 text-[12px] font-medium text-[#1f9d45]">Booked</div>}
                {preview && <div className="truncate pl-8 text-[12px] text-slate-400">{preview}</div>}
              </button>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="text-[13px] font-semibold">{formatMoney(driver.rate)}</div>
                {driver.status === "booked" ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1f9d45]">
                    <Check className="h-3.5 w-3.5" /> Booked
                  </span>
                ) : (
                  <button type="button" className="h-7 rounded-full border border-slate-200 px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-50" onClick={() => store.bookDriver(quote.id, driver.id)}>
                    Book driver
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DriverChat({ quote }) {
  const store = useStore();
  const driver = quote.drivers.find((item) => item.id === quote.selectedDriverId) || quote.drivers[0];
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [driver?.id, driver?.messages.length]);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  if (!driver) {
    return (
      <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-[13px] text-slate-400">
        Select a driver to open the offer chat.
      </div>
    );
  }

  const stopRecording = () => {
    const seconds = elapsed || 1;
    setRecording(false);
    setElapsed(0);
    store.sendDriverMessage(quote.id, driver.id, `Voice message (${seconds}s)`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e6ebf2] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-3">
        <div className="flex items-start gap-2">
          <Truck className="mt-0.5 h-4 w-4 text-amber-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[14px] font-semibold">
                {driver.code} {driver.name} ({driver.state})
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 text-[11px] font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {driver.score || driver.rating.toFixed(2)}
              </span>
              {driver.flag === "CA" && <span title="Canada">🇨🇦</span>}
              {driver.tags?.includes("Only ING") && (
                <span className="rounded-full bg-[#ffeceb] px-1.5 py-px text-[10px] font-semibold text-[#d92d20]">Only ING</span>
              )}
              {driver.tags?.includes("Other company sticker") && (
                <span className="rounded-full border border-[#ffb4ae] px-1.5 py-px text-[10px] font-semibold text-[#d92d20]">Other company sticker</span>
              )}
            </div>
            <div className="mt-0.5 text-[12.5px] text-slate-500">
              {driver.company} <span className="text-slate-400">[{driver.companyCode}]</span>
            </div>
          </div>
          {driver.status !== "booked" && (
            <button type="button" className={btnPrimary} onClick={() => store.bookDriver(quote.id, driver.id)}>
              Book driver
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-slate-500">
          <span>Loaded miles: <b className="font-semibold text-slate-700">{driver.details.miles}</b></span>
          <span>Weight, lbs: <b className="font-semibold text-slate-700">{Number(driver.details.weight).toLocaleString("en-US")}</b></span>
          <span>Pallets/Pieces: <b className="font-semibold text-slate-700">{driver.details.pallets}</b></span>
          <span>DIMS, in: <b className="font-semibold text-slate-700">{driver.details.dims}</b></span>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-auto px-3 py-3">
        {driver.messages.map((message) => {
          if (message.type === "event") {
            return (
              <div key={message.id} className="text-center">
                <div className="text-[12.5px] text-slate-500">{message.text}</div>
                <div className="text-[11px] text-slate-400">{message.time}</div>
              </div>
            );
          }
          if (message.type === "offer") {
            return <OfferCard key={message.id} quote={quote} driver={driver} message={message} />;
          }
          const mine = message.from === "me";
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] ${mine ? "bg-[#2f6cf6] text-white" : "bg-slate-100 text-slate-700"}`}>
                <div>{message.text}</div>
                <div className={`mt-0.5 text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>{message.time}</div>
              </div>
            </div>
          );
        })}
        {driver.messages.every((message) => message.type !== "offer") && (driver.status === "accepted" || driver.note) && (
          <OfferCard
            quote={quote}
            driver={driver}
            message={{
              eta: driver.eta,
              etaAt: driver.etaAt,
              rate: driver.rate,
              note: driver.note || "Standing by for dispatch.",
              location: driver.location,
            }}
          />
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-100 px-3 py-2">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => store.sendDriverMessage(quote.id, driver.id, reply)}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[12px] text-slate-600 hover:bg-slate-50"
            >
              {reply}
            </button>
          ))}
        </div>
        {recording && (
          <div className="mb-2 flex items-center gap-2 text-[12px] text-red-500">
            <span className="rec-dot h-2 w-2 rounded-full bg-red-500" />
            Recording {elapsed}s — tap the mic to send
          </div>
        )}
        <MessageBox
          placeholder="Write a message"
          extra={
            <>
              <button type="button" aria-label="Attach file" className="text-slate-400 hover:text-slate-600" onClick={() => fileRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) store.sendDriverMessage(quote.id, driver.id, `Attached: ${file.name}`);
                  event.target.value = "";
                }}
              />
            </>
          }
          trailing={
            <button
              type="button"
              aria-label={recording ? "Send voice message" : "Record voice message"}
              className={recording ? "text-red-500" : "text-slate-400 hover:text-slate-600"}
              onClick={() => (recording ? stopRecording() : setRecording(true))}
            >
              <Mic className="h-4 w-4" />
            </button>
          }
          onSend={(text) => store.sendDriverMessage(quote.id, driver.id, text)}
        />
      </div>
    </div>
  );
}

function OfferCard({ quote, driver, message }) {
  const store = useStore();
  const holding = driver.status === "hold";
  return (
    <div className="rounded-2xl border border-[#d5e6ff] bg-[#eaf3ff] p-3">
      <div className="flex items-start justify-between gap-2 text-[13px]">
        <div>
          <span className="font-semibold">ETA to PU: {message.eta}</span>
        </div>
        <div className="inline-flex items-center gap-1 text-[12px] text-slate-500">
          {message.etaAt} <Flag className="h-3.5 w-3.5 text-amber-500" />
        </div>
      </div>
      <div className="mt-1 text-[13px]">
        Rate: <span className="font-semibold">{formatMoney(message.rate)}</span>
      </div>
      {message.note && <div className="mt-1 text-[12.5px] text-slate-600">Note: {message.note}</div>}
      <div className="mt-1 text-[12px] text-slate-500">{message.location}</div>
      <button
        type="button"
        disabled={driver.status === "booked"}
        onClick={() => store.holdDriver(quote.id, driver.id)}
        className={`${btnPrimary} mt-3 w-full disabled:bg-[#3dce5a]`}
      >
        {driver.status === "booked" ? "Booked" : holding ? "Release hold" : "Put on Hold"}
      </button>
    </div>
  );
}

function MessageBox({ onSend, placeholder, extra, trailing }) {
  const [text, setText] = useState("");
  return (
    <form
      className="mt-2 flex items-center gap-2 rounded-full border border-slate-200 px-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
      }}
    >
      {extra}
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
      />
      {trailing}
      <button type="submit" aria-label="Send" className="text-slate-400 hover:text-[#2f6cf6]">
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}

function formatTimer(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
