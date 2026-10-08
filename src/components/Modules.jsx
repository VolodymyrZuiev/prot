import { stageOf } from "../data";
import { useStore } from "../store";

const COLUMNS = [
  { id: "new", label: "New" },
  { id: "bid", label: "BID created" },
  { id: "offer", label: "Offer created" },
  { id: "booked", label: "Booked" },
];

export function Modules() {
  const store = useStore();
  if (store.nav === "home") return <Home />;
  if (store.nav === "fleet") return <Fleet />;
  if (store.nav === "customers") return <Customers />;
  if (store.nav === "loads") return <Loads />;
  if (store.nav === "analytics") return <Analytics />;
  if (store.nav === "history") return <History />;
  if (store.nav === "deals") return <Deals />;
  if (store.nav === "team") return <Team />;
  return <Apps />;
}

function Page({ title, children }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <div className="scroll-thin mt-4 min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function Home() {
  const store = useStore();
  const mine = store.quotes.filter((quote) => quote.department === store.department && !quote.archived);
  const stats = [
    { label: "Active quotes", value: mine.length, run: () => store.setStatusFilter("new-active") },
    { label: "New", value: mine.filter((quote) => quote.isNew).length, run: () => store.setStatusFilter("new") },
    { label: "Bids out", value: mine.filter((quote) => quote.bidCreated).length, run: () => store.setStatusFilter("bid") },
    {
      label: "Booked drivers",
      value: mine.reduce((sum, quote) => sum + quote.drivers.filter((driver) => driver.status === "booked").length, 0),
      run: () => store.setNav("loads"),
    },
  ];

  return (
    <Page title="Desk">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => {
              stat.run();
              if (stat.label !== "Booked drivers") {
                store.closeWorkspace();
                store.setNav("quotes");
              }
            }}
            className="rounded-2xl bg-white p-4 text-left shadow-sm"
          >
            <div className="text-[12px] text-slate-500">{stat.label}</div>
            <div className="mt-1 text-3xl font-semibold">{stat.value}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Latest activity</div>
        <div className="mt-2 divide-y divide-slate-100">
          {store.activity.slice(0, 6).map((item) => (
            <button key={item.id} type="button" onClick={() => item.quoteId && store.openWorkspace(item.quoteId)} className="flex w-full items-center justify-between py-2 text-left text-[13px] hover:text-[#2f6cf6]">
              <span>{item.text}</span>
              <span className="text-slate-400">{item.time}</span>
            </button>
          ))}
        </div>
      </div>
    </Page>
  );
}

function Fleet() {
  const store = useStore();
  const rows = store.quotes.flatMap((quote) => quote.drivers.map((driver) => ({ ...driver, quote })));
  return (
    <Page title="Fleet">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {rows.map((driver) => (
          <button
            key={`${driver.quote.id}-${driver.id}`}
            type="button"
            onClick={() => store.openWorkspace(driver.quote.id)}
            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
          >
            <span className="w-14 text-[13px] font-semibold">{driver.code}</span>
            <span className="flex-1 text-[13px]">{driver.name} · {driver.state}</span>
            <span className="text-[12px] text-slate-500">{driver.quote.company}</span>
            <span className="text-[12px] capitalize text-slate-400">{driver.status}</span>
          </button>
        ))}
        {rows.length === 0 && <div className="p-8 text-center text-sm text-slate-400">Drivers show up after a bid is posted.</div>}
      </div>
    </Page>
  );
}

function Customers() {
  const store = useStore();
  const groups = new Map();
  store.quotes.forEach((quote) => {
    const current = groups.get(quote.company) || [];
    current.push(quote);
    groups.set(quote.company, current);
  });
  return (
    <Page title="Customers">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...groups.entries()].map(([company, quotes]) => (
          <button
            key={company}
            type="button"
            onClick={() => {
              store.setQuery(company);
              store.setStatusFilter("new-active");
              store.setTab("active");
              store.setNav("quotes");
              store.closeWorkspace();
            }}
            className="rounded-2xl bg-white p-4 text-left shadow-sm hover:ring-2 hover:ring-[#2f6cf6]/20"
          >
            <div className="font-semibold">{company}</div>
            <div className="mt-1 text-[12px] text-slate-500">{quotes.length} quotes · {quotes[0].contact}</div>
            <div className="text-[12px] text-[#2f6cf6]">{quotes[0].email}</div>
          </button>
        ))}
      </div>
    </Page>
  );
}

function Loads() {
  const store = useStore();
  const loads = store.quotes.flatMap((quote) =>
    quote.drivers.filter((driver) => driver.status === "booked").map((driver) => ({ driver, quote }))
  );
  return (
    <Page title="Loads">
      {loads.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No booked loads yet. Book a driver from a quote to see it here.</div>
      ) : (
        <div className="space-y-2">
          {loads.map(({ driver, quote }) => (
            <div key={driver.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <div className="min-w-[180px]">
                <div className="text-sm font-semibold">#{quote.number} {quote.company}</div>
                <div className="text-[12px] text-slate-500">{quote.lane}</div>
              </div>
              <div className="text-[13px]">{driver.code} {driver.name}</div>
              <button type="button" className="ml-auto text-[13px] font-semibold text-[#2f6cf6]" onClick={() => store.openWorkspace(quote.id)}>
                Open quote
              </button>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}

function Analytics() {
  const store = useStore();
  const counts = new Map();
  store.quotes.filter((quote) => !quote.archived).forEach((quote) => {
    counts.set(quote.company, (counts.get(quote.company) || 0) + 1);
  });
  const max = Math.max(...counts.values(), 1);
  return (
    <Page title="Analytics">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Active quotes by customer</div>
        <div className="mt-4 space-y-3">
          {[...counts.entries()].map(([company, count]) => (
            <div key={company}>
              <div className="mb-1 flex justify-between text-[12px] text-slate-500">
                <span>{company}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-[#2f6cf6]" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

function History() {
  const store = useStore();
  return (
    <Page title="History">
      <div className="rounded-2xl bg-white shadow-sm">
        {store.activity.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => item.quoteId && store.openWorkspace(item.quoteId)}
            className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
          >
            <span className="text-[13px]">{item.text}</span>
            <span className="text-[12px] text-slate-400">{item.time}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}

function Deals() {
  const store = useStore();
  const quotes = store.quotes.filter((quote) => !quote.archived);
  return (
    <Page title="Deals">
      <p className="mb-3 text-[13px] text-slate-500">Drag a quote into another column to change its stage.</p>
      <div className="grid min-h-[420px] gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData("text/plain");
              if (id) store.moveStage(id, column.id);
            }}
            className="rounded-2xl bg-white/80 p-3"
          >
            <div className="mb-2 text-[13px] font-semibold">{column.label}</div>
            <div className="space-y-2">
              {quotes.filter((quote) => stageOf(quote) === column.id).map((quote) => (
                <div
                  key={quote.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", quote.id)}
                  onClick={() => store.openWorkspace(quote.id)}
                  className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm active:cursor-grabbing"
                >
                  <div className="text-[13px] font-semibold">{quote.company}</div>
                  <div className="text-[12px] text-slate-500">#{quote.number}</div>
                  <div className="truncate text-[12px] text-slate-400">{quote.lane}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function Team() {
  const store = useStore();
  const people = [
    { name: "Andrew Jameson", role: "Dispatcher", status: store.userStatus },
    { name: "Anna Lu", role: "Carrier sales", status: "Online" },
    { name: "Robert Nelson", role: "Expedite desk", status: "Away" },
    { name: "Priya Shah", role: "OTR desk", status: "Online" },
  ];
  return (
    <Page title="Team">
      <div className="grid gap-3 md:grid-cols-2">
        {people.map((person) => (
          <div key={person.name} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="font-semibold">{person.name}</div>
            <div className="text-[13px] text-slate-500">{person.role}</div>
            <div className="mt-2 text-[12px] font-medium text-[#1f9d45]">{person.status}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function Apps() {
  const store = useStore();
  const tiles = [
    ["quotes", "Quotes", "Broker email inbox"],
    ["deals", "Deals", "Stage board"],
    ["fleet", "Fleet", "Drivers on offers"],
    ["loads", "Loads", "Booked freight"],
    ["customers", "Customers", "Shipper directory"],
    ["analytics", "Analytics", "Quote volume"],
    ["history", "History", "Desk activity"],
    ["home", "Desk", "Today at a glance"],
  ];
  return (
    <Page title="Apps">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([id, label, detail]) => (
          <button key={id} type="button" onClick={() => store.setNav(id)} className="rounded-2xl bg-white p-4 text-left shadow-sm hover:ring-2 hover:ring-[#2f6cf6]/20">
            <div className="font-semibold">{label}</div>
            <div className="mt-1 text-[12px] text-slate-500">{detail}</div>
          </button>
        ))}
      </div>
    </Page>
  );
}
