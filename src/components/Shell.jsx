import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Home,
  LayoutGrid,
  MapPin,
  Package,
  Plus,
  Truck,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";
import { COMPANIES, DEPARTMENTS, formatClock } from "../data";
import { useStore } from "../store";
import { Logo } from "./ui";
import { QuotesBoard } from "./QuotesBoard";
import { Workspace } from "./Workspace";
import { CheckQuoteModal, NewBidModal } from "./CheckQuoteModal";
import { Modules } from "./Modules";
import { PricingPopover } from "./PricingPopover";

const NAV = [
  { id: "team", label: "Team", icon: Users },
  { id: "fleet", label: "Fleet", icon: Truck },
  { id: "quotes", label: "Quotes", icon: MapPin },
  { id: "customers", label: "Customers", icon: UserRound },
  { id: "loads", label: "Loads", icon: Package },
  { id: "home", label: "Home", icon: Warehouse },
  { id: "deals", label: "Deals", icon: Briefcase },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "History", icon: Clock },
  { id: "apps", label: "Apps", icon: LayoutGrid },
];

export function Shell() {
  const store = useStore();
  if (!store.signedIn) return <SignedOut />;

  return (
    <div className="flex h-full bg-[#e7eef6] text-[#1c2434]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 px-4 pb-4">
          {store.nav === "quotes" && store.view === "workspace" && store.workspaceQuote ? (
            <Workspace />
          ) : store.nav === "quotes" ? (
            <QuotesBoard />
          ) : (
            <Modules />
          )}
        </main>
      </div>
      {store.modalQuote && <CheckQuoteModal />}
      {store.newBidOpen && <NewBidModal />}
      <ToastStack />
    </div>
  );
}

function Sidebar() {
  const { nav, setNav, sidebarCollapsed, setSidebarCollapsed, closeWorkspace } = useStore();
  const collapsed = sidebarCollapsed;

  return (
    <aside className={`flex shrink-0 flex-col border-r border-slate-200/80 bg-white py-3 ${collapsed ? "w-[68px]" : "w-[196px]"}`}>
      <button
        type="button"
        title={collapsed ? "Expand menu" : "Collapse menu"}
        onClick={() => setSidebarCollapsed(!collapsed)}
        className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
      >
        {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
      </button>
      <nav className="flex flex-1 flex-col gap-1 px-2.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const selected = nav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => {
                setNav(item.id);
                if (item.id === "quotes") closeWorkspace();
              }}
              className={`flex h-10 items-center rounded-xl text-[13px] font-medium ${
                collapsed ? "w-10 justify-center" : "gap-3 px-2.5"
              } ${selected ? "bg-[#2f6cf6] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      {!collapsed && (
        <button
          type="button"
          onClick={() => setNav("home")}
          className="mx-3 mt-2 flex items-center gap-2 rounded-xl px-2 py-2 text-left text-slate-400 hover:bg-slate-50"
        >
          <Home className="h-4 w-4" />
          <span className="text-xs">Desk home</span>
        </button>
      )}
    </aside>
  );
}

function TopBar() {
  const store = useStore();
  const [clock, setClock] = useState(() => formatClock());
  const [companyOpen, setCompanyOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const unread = store.notifications.filter((item) => item.unread).length;

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex min-h-[60px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
      <Logo />
      <button
        type="button"
        onClick={() => store.setNewBidOpen(true)}
        className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#2f6cf6] hover:text-[#1d4fd0]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        New Bid
      </button>
      <button
        type="button"
        onClick={() => {
          store.setOtrOnly(!store.otrOnly);
          store.setNav("quotes");
          if (store.view === "workspace") store.closeWorkspace();
        }}
        className={`h-7 rounded-full border px-3 text-[13px] font-semibold ${
          store.otrOnly
            ? "border-[#3dce5a] bg-[#3dce5a] text-white"
            : "border-[#46d15f] bg-white text-[#1f9d45]"
        }`}
      >
        OTR
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => store.setPricingOpen(!store.pricingOpen)}
          className="h-7 rounded-full bg-[#3dce5a] px-3 text-[13px] font-semibold text-white hover:bg-[#2fbe4c]"
        >
          Pricing
        </button>
        {store.pricingOpen && <PricingPopover />}
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
        <PillMenu
          open={companyOpen}
          setOpen={setCompanyOpen}
          label={store.company}
          options={COMPANIES}
          onPick={(value) => {
            store.setCompany(value);
            store.pushToast(`Working as ${value}`);
          }}
        />
        <PillMenu
          open={deptOpen}
          setOpen={setDeptOpen}
          label={store.department}
          options={DEPARTMENTS}
          onPick={(value) => {
            store.setDepartment(value);
            store.setNav("quotes");
            if (store.view === "workspace") store.closeWorkspace();
          }}
        />
        <div className="ml-2 hidden items-center gap-2 text-[12px] text-slate-400 md:flex">
          <span className="tracking-[0.08em]">EASTERN TIME</span>
          <span className="font-medium text-slate-500">{clock}</span>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => {
            setNotifsOpen((open) => !open);
            setUserOpen(false);
          }}
          className="relative grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-white"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff3b30]" />}
        </button>
        {notifsOpen && (
          <Popover onClose={() => setNotifsOpen(false)} className="right-0 w-[320px]">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="text-sm font-semibold">Notifications</div>
              <button type="button" className="text-xs font-medium text-[#2f6cf6]" onClick={store.markNotificationsRead}>
                Mark read
              </button>
            </div>
            <div className="max-h-80 overflow-auto">
              {store.notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    store.openNotification(item);
                    setNotifsOpen(false);
                  }}
                  className="flex w-full gap-2 border-t border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.unread ? "bg-[#ff3b30]" : "bg-slate-200"}`} />
                  <span>
                    <span className="block text-[13px] font-medium">{item.title}</span>
                    <span className="block text-[12px] text-slate-500">{item.detail}</span>
                    <span className="text-[11px] text-slate-400">{item.time}</span>
                  </span>
                </button>
              ))}
            </div>
          </Popover>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setUserOpen((open) => !open);
            setNotifsOpen(false);
          }}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-white"
        >
          <span className="hidden text-[13px] font-medium text-slate-700 sm:inline">Andrew Jameson</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-[11px] font-semibold text-white">
            AJ
          </span>
        </button>
        {userOpen && (
          <Popover onClose={() => setUserOpen(false)} className="right-0 w-60">
            <div className="px-3 py-2">
              <div className="text-sm font-semibold">Andrew Jameson</div>
              <div className="text-xs text-slate-500">Dispatcher · {store.company}</div>
            </div>
            <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">Status</div>
            {["Online", "Away", "Do not disturb"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => store.setUserStatus(status)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] hover:bg-slate-50"
              >
                {status}
                {store.userStatus === status && <span className="text-[#2f6cf6]">●</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                store.setSignedIn(false);
                setUserOpen(false);
              }}
              className="mt-1 w-full border-t border-slate-100 px-3 py-2 text-left text-[13px] text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </Popover>
        )}
      </div>
    </header>
  );
}

function PillMenu({ open, setOpen, label, options, onPick }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-8 items-center gap-2 rounded-full border border-white bg-white px-3 text-[13px] font-medium text-slate-700 shadow-sm"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <Popover onClose={() => setOpen(false)} className="left-0 w-56">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onPick(option);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-slate-50 ${option === label ? "font-semibold text-[#2f6cf6]" : ""}`}
            >
              {option}
            </button>
          ))}
        </Popover>
      )}
    </div>
  );
}

function Popover({ children, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const onPointer = (event) => {
      if (!ref.current?.contains(event.target)) onClose();
    };
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} className={`absolute top-11 z-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function ToastStack() {
  const { toasts, dismissToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[70] flex w-[320px] flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-in pointer-events-auto flex items-center gap-3 rounded-xl bg-[#1c2434] px-3 py-2.5 text-[13px] text-white shadow-lg">
          <span className="flex-1">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              className="font-semibold text-[#9ec0ff]"
              onClick={() => {
                toast.undo();
                dismissToast(toast.id);
              }}
            >
              Undo
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function SignedOut() {
  const { setSignedIn } = useStore();
  return (
    <div className="grid h-full place-items-center bg-[#e7eef6]">
      <div className="w-[360px] rounded-2xl bg-white p-8 text-center shadow-xl">
        <Logo className="mx-auto h-10 w-10" />
        <h1 className="mt-4 text-xl font-semibold">Empire National</h1>
        <p className="mt-1 text-sm text-slate-500">Sign back in to the expedite desk.</p>
        <button
          type="button"
          onClick={() => setSignedIn(true)}
          className="mt-6 h-10 w-full rounded-full bg-[#2f6cf6] text-sm font-semibold text-white"
        >
          Continue as Andrew Jameson
        </button>
      </div>
    </div>
  );
}
