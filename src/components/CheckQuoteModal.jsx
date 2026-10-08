import { useEffect, useState } from "react";
import { MapPin, Plus, Send, X } from "lucide-react";
import { CITIES, DEPARTMENTS, QUICK_REPLIES, estimateMiles, recommendRate } from "../data";
import { useStore } from "../store";
import { EmailLines, btnPrimary, btnQuiet } from "./ui";

const EMPTY_FORM = {
  pu: "",
  puTime: "",
  del: "",
  delTime: "",
  miles: "",
  weight: "",
  pallets: "",
  dims: "",
  rate: "",
  note: "",
  stops: [],
};

export function CheckQuoteModal() {
  const store = useStore();
  const quote = store.modalQuote;
  const [form, setForm] = useState(EMPTY_FORM);
  const [draft, setDraft] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!quote) return;
    setForm({
      pu: quote.form.pu || "",
      puTime: quote.form.puTime || "",
      del: quote.form.del || "",
      delTime: quote.form.delTime || "",
      miles: quote.form.miles || "",
      weight: quote.form.weight || "",
      pallets: quote.form.pallets || "",
      dims: quote.form.dims || "",
      rate: quote.form.rate || "",
      note: quote.form.note || "",
      stops: quote.form.stops || [],
    });
    setDraft("");
    setErrors({});
  }, [quote?.id]);

  useEffect(() => {
    if (!store.rateSeed) return;
    setForm((current) => ({ ...current, rate: String(store.rateSeed.value).replace(/[^\d]/g, "") }));
  }, [store.rateSeed]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") store.closeCheck();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  if (!quote) return null;

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addStop = (side) => {
    setForm((current) => ({
      ...current,
      stops: [...current.stops, { id: `${Date.now()}`, side, location: "", when: "" }],
    }));
  };

  const fillMiles = () => {
    const chain = [form.pu, ...form.stops.map((stop) => stop.location), form.del];
    const miles = estimateMiles(chain);
    set("miles", String(miles));
    store.pushToast(`Loaded miles set to ${miles}`);
  };

  const fillRate = () => {
    const miles = form.miles || estimateMiles([form.pu, ...form.stops.map((stop) => stop.location), form.del]);
    const rate = recommendRate(miles, form.weight, quote.equipment);
    setForm((current) => ({ ...current, miles: current.miles || String(miles), rate: String(rate) }));
    store.pushToast("Recommended rate applied");
  };

  const submit = () => {
    const next = {};
    if (!form.pu.trim()) next.pu = "Pickup is required";
    if (!form.del.trim()) next.del = "Delivery is required";
    if (!form.rate.trim()) next.rate = "Add a rate or use Get rate";
    setErrors(next);
    if (Object.keys(next).length) return;
    store.createBid(quote.id, form);
  };

  const send = (text) => {
    const value = (text ?? draft).trim();
    if (!value) return;
    store.sendCustomerMessage(quote.id, value);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-3 sm:p-6" onMouseDown={store.closeCheck}>
      <div
        role="dialog"
        aria-labelledby="check-quote-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="modal-pop flex max-h-[92vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between px-5 py-4">
          <h2 id="check-quote-title" className="text-[18px] font-semibold">
            Check quote
          </h2>
          <button type="button" aria-label="Close" onClick={store.closeCheck} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-auto px-5 pb-2 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="flex min-h-[420px] flex-col rounded-2xl border border-slate-200 p-4">
            <div className="text-[15px] font-semibold">{quote.company}</div>
            <div className="text-[13px] text-slate-600">{quote.contact}</div>
            <a className="text-[12.5px] text-[#2f6cf6]" href={`mailto:${quote.email}`}>
              {quote.email}
            </a>
            <div className="text-[12px] text-slate-400">{quote.timestamp}</div>
            <div className="scroll-thin mt-3 flex-1 space-y-4 overflow-auto pr-1">
              {quote.thread.map((message, index) => (
                <div key={message.id} className={message.from === "me" ? "rounded-xl bg-[#eef4ff] p-3" : index > 0 ? "border-t border-slate-100 pt-3" : ""}>
                  {(index > 0 || message.from === "me") && (
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{message.from === "me" ? "You" : message.name}</span>
                      <span>{message.time}</span>
                    </div>
                  )}
                  <EmailLines lines={message.body} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => send(reply)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[12px] text-slate-600 hover:bg-slate-50"
                >
                  {reply}
                </button>
              ))}
            </div>
            <form
              className="mt-2 flex items-center gap-2 rounded-full border border-slate-200 px-3"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a message"
                className="h-10 flex-1 bg-transparent text-[13px] outline-none"
              />
              <button type="submit" aria-label="Send reply" className="text-slate-400 hover:text-[#2f6cf6]">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </section>

          <section className="min-w-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <LaneFields
                title="PU"
                location={form.pu}
                when={form.puTime}
                error={errors.pu}
                onLocation={(value) => set("pu", value)}
                onWhen={(value) => set("puTime", value)}
                onAdd={() => addStop("pu")}
              />
              <LaneFields
                title="DEL"
                location={form.del}
                when={form.delTime}
                error={errors.del}
                onLocation={(value) => set("del", value)}
                onWhen={(value) => set("delTime", value)}
                whenPlaceholder="Enter date/time"
                onAdd={() => addStop("del")}
              />
            </div>

            {form.stops.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-2">
                    <span className="w-10 text-[11px] font-semibold text-slate-400">{stop.side === "pu" ? "PU+" : "DEL+"}</span>
                    <PillInput
                      icon
                      value={stop.location}
                      placeholder="Stop city"
                      onChange={(value) =>
                        set(
                          "stops",
                          form.stops.map((item) => (item.id === stop.id ? { ...item, location: value } : item))
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove stop"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
                      onClick={() =>
                        set(
                          "stops",
                          form.stops.filter((item) => item.id !== stop.id)
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="sr-only">Stop {index + 1}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1 text-[12px] font-medium text-slate-500">Loaded miles</div>
              <div className="flex gap-2">
                <input
                  value={form.miles}
                  onChange={(event) => set("miles", event.target.value)}
                  className="h-9 w-28 rounded-full border border-slate-200 px-3 text-[13px] outline-none"
                />
                <button type="button" onClick={fillMiles} className={btnQuiet}>
                  Get miles
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Labeled label="Weight, lbs">
                <input value={form.weight} onChange={(event) => set("weight", event.target.value)} placeholder="380 lbs" className={inputClass} />
              </Labeled>
              <Labeled label="Pallets/Pieces">
                <input value={form.pallets} onChange={(event) => set("pallets", event.target.value)} placeholder="10 ft - Full" className={inputClass} />
              </Labeled>
              <Labeled label="DIMS, in">
                <input value={form.dims} onChange={(event) => set("dims", event.target.value)} placeholder="XX x XX x XX" className={inputClass} />
              </Labeled>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-[12px] font-medium text-slate-500">Recommended rate</div>
              <div className="flex gap-2">
                <div className={`flex h-9 items-center rounded-full border px-3 ${errors.rate ? "border-red-400" : "border-[#2f6cf6]"}`}>
                  <span className="text-[13px] text-slate-400">$</span>
                  <input
                    value={String(form.rate).replace(/[^\d.]/g, "")}
                    onChange={(event) => set("rate", event.target.value)}
                    className="w-24 bg-transparent text-[13px] outline-none"
                  />
                </div>
                <button type="button" onClick={fillRate} className={btnQuiet}>
                  Get rate
                </button>
              </div>
              {errors.rate && <p className="mt-1 text-[12px] text-red-500">{errors.rate}</p>}
            </div>

            <div className="mt-4">
              <div className="mb-1 text-[12px] font-medium text-slate-500">Note</div>
              <textarea
                value={form.note}
                onChange={(event) => set("note", event.target.value)}
                placeholder="Enter note"
                className="h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none"
              />
            </div>
          </section>
        </div>

        <datalist id="city-list">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
        <footer className="flex items-center justify-end gap-3 px-5 py-4">
          <button type="button" onClick={store.closeCheck} className="text-[13px] font-medium text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          <button type="button" onClick={submit} className={btnPrimary}>
            Create BID & Offer
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputClass = "h-9 w-full rounded-full border border-slate-200 px-3 text-[13px] outline-none";

function Labeled({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function LaneFields({ title, location, when, onLocation, onWhen, onAdd, error, whenPlaceholder = "Date/Time" }) {
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold tracking-wide text-slate-500">{title}</div>
      <PillInput icon value={location} onChange={onLocation} placeholder="City, ST" invalid={Boolean(error)} />
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
      <div className="mb-1 mt-3 text-[12px] text-slate-500">Date/Time</div>
      <input value={when} onChange={(event) => onWhen(event.target.value)} placeholder={whenPlaceholder} className={inputClass} />
      <button type="button" onClick={onAdd} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#2f6cf6]">
        <Plus className="h-3.5 w-3.5" /> Add stop
      </button>
    </div>
  );
}

function PillInput({ value, onChange, placeholder, icon, invalid }) {
  return (
    <label className={`flex h-9 items-center gap-2 rounded-full border px-3 ${invalid ? "border-red-400" : "border-slate-200"}`}>
      {icon && <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
      <input
        value={value}
        list="city-list"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13px] outline-none"
      />
    </label>
  );
}

export function NewBidModal() {
  const store = useStore();
  const [draft, setDraft] = useState({
    company: "",
    contact: "",
    email: "",
    pu: "",
    del: "",
    puTime: "ASAP",
    weight: "",
    pallets: "",
    dims: "",
    cargo: "",
    equipment: "Van",
    department: store.department,
    subject: "quote",
  });
  const [error, setError] = useState("");

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!draft.company.trim() || !draft.contact.trim() || !draft.email.trim() || !draft.pu.trim() || !draft.del.trim()) {
      setError("Company, contact, email, pickup, and delivery are required.");
      return;
    }
    if (!draft.email.includes("@")) {
      setError("Enter a valid broker email.");
      return;
    }
    store.addQuote(draft);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" onMouseDown={() => store.setNewBidOpen(false)}>
      <form
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
        className="modal-pop w-full max-w-[560px] rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Bid</h2>
          <button type="button" aria-label="Close" onClick={() => store.setNewBidOpen(false)} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">Capture the broker email, then check the lane before it goes to drivers.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Text label="Company" value={draft.company} onChange={(value) => set("company", value)} />
          <Text label="Contact" value={draft.contact} onChange={(value) => set("contact", value)} />
          <Text label="Broker email" value={draft.email} onChange={(value) => set("email", value)} className="sm:col-span-2" />
          <Text label="Pickup" value={draft.pu} onChange={(value) => set("pu", value)} list="city-list" />
          <Text label="Delivery" value={draft.del} onChange={(value) => set("del", value)} list="city-list" />
          <Text label="Pickup time" value={draft.puTime} onChange={(value) => set("puTime", value)} />
          <label className="text-[12px] text-slate-500">
            Equipment
            <select value={draft.equipment} onChange={(event) => set("equipment", event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-[13px] text-slate-800">
              <option>Van</option>
              <option>Sprinter</option>
              <option>OTR</option>
            </select>
          </label>
          <Text label="Weight" value={draft.weight} onChange={(value) => set("weight", value)} />
          <Text label="Pallets / pieces" value={draft.pallets} onChange={(value) => set("pallets", value)} />
          <label className="text-[12px] text-slate-500 sm:col-span-2">
            Department
            <select value={draft.department} onChange={(event) => set("department", event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-[13px] text-slate-800">
              {DEPARTMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-slate-500 sm:col-span-2">
            Cargo notes
            <textarea value={draft.cargo} onChange={(event) => set("cargo", event.target.value)} className="mt-1 h-20 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[13px] outline-none" />
          </label>
        </div>
        {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={() => store.setNewBidOpen(false)} className="text-[13px] text-slate-500">
            Cancel
          </button>
          <button type="submit" className={btnPrimary}>
            Create quote
          </button>
        </div>
        <datalist id="city-list">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </form>
    </div>
  );
}

function Text({ label, value, onChange, className = "", list }) {
  return (
    <label className={`text-[12px] text-slate-500 ${className}`}>
      {label}
      <input list={list} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-[13px] text-slate-800 outline-none" />
    </label>
  );
}
