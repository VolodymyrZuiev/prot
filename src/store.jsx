import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  INITIAL_NOTIFICATIONS,
  INITIAL_QUOTES,
  driverReplyFor,
  formatNow,
  seedDrivers,
  uid,
} from "./data";

const StoreContext = createContext(null);

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

export function StoreProvider({ children }) {
  const [quotes, setQuotes] = useState(INITIAL_QUOTES);
  const [nav, setNav] = useState("quotes");
  const [view, setView] = useState("board");
  const [workspaceId, setWorkspaceId] = useState(null);
  const [tab, setTab] = useState("active");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("new-active");
  const [dateFilter, setDateFilter] = useState("all");
  const [company, setCompany] = useState("Empire National");
  const [department, setDepartment] = useState("Expedite Department");
  const [otrOnly, setOtrOnly] = useState(false);
  const [modalQuoteId, setModalQuoteId] = useState(null);
  const [newBidOpen, setNewBidOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [rateSeed, setRateSeed] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activity, setActivity] = useState([
    { id: "a1", text: "Quote #1245352 posted to 26 drivers", time: "06:18 PM", quoteId: "q-jj" },
    { id: "a2", text: "Anna Lu placed 2333 John Driver on hold", time: "05:41 PM", quoteId: "q-jj" },
    { id: "a3", text: "New email from General Electric", time: "04:16 PM", quoteId: "q-ge" },
  ]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [userStatus, setUserStatus] = useState("Online");
  const [signedIn, setSignedIn] = useState(true);
  const toastSeq = useRef(1);

  useEffect(() => {
    if (!workspaceId) return undefined;
    const timer = setInterval(() => {
      setQuotes((current) =>
        current.map((quote) =>
          quote.id === workspaceId && quote.offerTimer > 0
            ? { ...quote, offerTimer: quote.offerTimer - 1 }
            : quote
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [workspaceId]);

  const pushToast = (message, undo) => {
    const id = toastSeq.current;
    toastSeq.current += 1;
    setToasts((current) => [...current, { id, message, undo }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  };

  const dismissToast = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const log = (text, quoteId) => {
    setActivity((current) => [{ id: uid("act"), text, time: formatNow(), quoteId }, ...current].slice(0, 40));
  };

  const patchQuote = (id, updater) => {
    setQuotes((current) => current.map((quote) => (quote.id === id ? updater(quote) : quote)));
  };

  const openWorkspace = (id) => {
    patchQuote(id, (quote) => ({ ...quote, isNew: false }));
    setWorkspaceId(id);
    setView("workspace");
    setNav("quotes");
    setModalQuoteId(null);
  };

  const closeWorkspace = () => {
    setView("board");
    setWorkspaceId(null);
  };

  const openCheck = (id) => {
    patchQuote(id, (quote) => ({ ...quote, isNew: false }));
    setModalQuoteId(id);
  };

  const archiveQuote = (id) => {
    const target = quotes.find((quote) => quote.id === id);
    patchQuote(id, (quote) => ({ ...quote, archived: true }));
    if (workspaceId === id) closeWorkspace();
    log(`Archived ${target?.company || "quote"} #${target?.number || ""}`.trim(), id);
    pushToast(`Archived ${target?.company || "quote"}`, () => {
      patchQuote(id, (quote) => ({ ...quote, archived: false }));
    });
  };

  const restoreQuote = (id) => {
    patchQuote(id, (quote) => ({ ...quote, archived: false }));
    const target = quotes.find((quote) => quote.id === id);
    log(`Restored ${target?.company || "quote"}`, id);
    pushToast("Quote restored to Active");
    setTab("active");
  };

  const createBid = (id, form) => {
    patchQuote(id, (quote) => {
      const drivers = quote.drivers.length ? quote.drivers : seedDrivers({ ...quote, form }, 5);
      return {
        ...quote,
        form: { ...quote.form, ...form },
        bidCreated: true,
        offerCreated: true,
        isNew: false,
        offerTimer: 5 * 60,
        driversAvailable: true,
        drivers,
        selectedDriverId: quote.selectedDriverId || drivers[0]?.id || null,
        broadcast: {
          pu: form.pu,
          puWhen: form.puTime || "ASAP",
          del: form.del,
          delWhen: form.delTime || "TBD",
          postedAt: formatNow(),
          rate: Number(String(form.rate).replace(/[^\d.]/g, "")) || quote.broadcast?.rate || 0,
        },
        lane: `${form.pu} → ${form.del}`,
      };
    });
    const target = quotes.find((quote) => quote.id === id);
    log(`BID & Offer created for ${target?.company || "quote"}`, id);
    pushToast("BID & Offer created");
    setModalQuoteId(null);
    setWorkspaceId(id);
    setView("workspace");
    setNav("quotes");
  };

  const sendCustomerMessage = (id, text) => {
    const body = text.trim();
    if (!body) return;
    patchQuote(id, (quote) => ({
      ...quote,
      thread: [
        ...quote.thread,
        {
          id: uid("th"),
          from: "me",
          name: "Andrew Jameson",
          time: formatNow(),
          body: [{ type: "text", value: body }],
        },
      ],
    }));
  };

  const appendDriverMessage = (quoteId, driverId, message) => {
    patchQuote(quoteId, (quote) => ({
      ...quote,
      drivers: quote.drivers.map((driver) =>
        driver.id === driverId ? { ...driver, messages: [...driver.messages, message] } : driver
      ),
    }));
  };

  const sendDriverMessage = (quoteId, driverId, text) => {
    const body = text.trim();
    if (!body) return;
    const mine = { id: uid("dm"), type: "text", from: "me", text: body, time: formatNow() };
    appendDriverMessage(quoteId, driverId, mine);
    const reply = driverReplyFor(body);
    window.setTimeout(() => {
      appendDriverMessage(quoteId, driverId, {
        id: uid("dm"),
        type: "text",
        from: "driver",
        text: reply,
        time: formatNow(),
      });
    }, 800);
  };

  const selectDriver = (quoteId, driverId) => {
    patchQuote(quoteId, (quote) => ({ ...quote, selectedDriverId: driverId }));
  };

  const bookDriver = (quoteId, driverId) => {
    const target = quotes.find((quote) => quote.id === quoteId);
    const driver = target?.drivers.find((item) => item.id === driverId);
    if (!driver || driver.status === "booked") return;
    patchQuote(quoteId, (quote) => ({
      ...quote,
      bidCreated: true,
      offerCreated: true,
      drivers: quote.drivers.map((item) =>
        item.id !== driverId
          ? item
          : {
              ...item,
              status: "booked",
              checked: false,
              messages: [
                ...item.messages,
                { id: uid("dm"), type: "event", text: `You booked ${item.name}`, time: formatNow() },
                { id: uid("dm"), type: "text", from: "driver", text: "Booked. I'm on my way to pickup.", time: formatNow() },
              ],
            }
      ),
    }));
    log(`Booked ${driver.name} on #${target?.number || ""}`, quoteId);
    pushToast(`${driver.name} booked`);
  };

  const holdDriver = (quoteId, driverId) => {
    const target = quotes.find((quote) => quote.id === quoteId);
    const driver = target?.drivers.find((item) => item.id === driverId);
    if (!driver || driver.status === "booked") return;
    const releasing = driver.status === "hold";
    patchQuote(quoteId, (quote) => ({
      ...quote,
      drivers: quote.drivers.map((item) =>
        item.id !== driverId
          ? item
          : {
              ...item,
              status: releasing ? "bidding" : "hold",
              holdBy: releasing ? "" : "Andrew Jameson",
              messages: [
                ...item.messages,
                {
                  id: uid("dm"),
                  type: "event",
                  text: releasing ? `Hold released on ${item.name}` : "Put on hold by Andrew Jameson",
                  time: formatNow(),
                },
              ],
            }
      ),
    }));
    pushToast(releasing ? `Hold released for ${driver.name}` : `${driver.name} put on hold`);
  };

  const toggleDriverCheck = (quoteId, driverId) => {
    patchQuote(quoteId, (quote) => ({
      ...quote,
      drivers: quote.drivers.map((driver) =>
        driver.id === driverId ? { ...driver, checked: !driver.checked } : driver
      ),
    }));
  };

  const setVisibleChecks = (quoteId, ids, checked) => {
    const set = new Set(ids);
    patchQuote(quoteId, (quote) => ({
      ...quote,
      drivers: quote.drivers.map((driver) => (set.has(driver.id) ? { ...driver, checked } : driver)),
    }));
  };

  const archiveDrivers = (quoteId, ids) => {
    const set = new Set(ids);
    patchQuote(quoteId, (quote) => ({
      ...quote,
      drivers: quote.drivers.map((driver) =>
        set.has(driver.id) && driver.status !== "booked"
          ? { ...driver, status: "archived", checked: false }
          : driver
      ),
    }));
    pushToast("Offers archived");
  };

  const restoreDrivers = (quoteId, ids) => {
    const set = new Set(ids);
    patchQuote(quoteId, (quote) => ({
      ...quote,
      drivers: quote.drivers.map((driver) =>
        set.has(driver.id) && driver.status === "archived" ? { ...driver, status: "bidding" } : driver
      ),
    }));
  };

  const updateOffer = (quoteId, patch) => {
    patchQuote(quoteId, (quote) => ({
      ...quote,
      offerTimer: 5 * 60,
      driversAvailable: true,
      broadcast: { ...quote.broadcast, ...patch, postedAt: formatNow() },
      drivers: quote.drivers.map((driver) =>
        driver.status === "archived"
          ? driver
          : {
              ...driver,
              rate: patch.rate || driver.rate,
              messages: [
                ...driver.messages,
                {
                  id: uid("dm"),
                  type: "event",
                  text: `Offer updated to $${Number(patch.rate || driver.rate).toLocaleString("en-US")}`,
                  time: formatNow(),
                },
              ],
            }
      ),
    }));
    pushToast("Offer updated");
  };

  const renewOffer = (quoteId) => {
    patchQuote(quoteId, (quote) => ({ ...quote, offerTimer: 5 * 60, driversAvailable: true }));
    pushToast("Offer renewed for 5:00");
    log("Offer timer renewed", quoteId);
  };

  const addQuote = (draft) => {
    const id = uid("q");
    const number = String(1400000 + Math.floor(Math.random() * 80000));
    const body = [
      { type: "subject", value: draft.subject || "quote" },
      { type: "text", value: `${draft.pu} to ${draft.del}` },
      { type: "text", value: draft.cargo || "Cargo details pending." },
    ];
    const next = {
      id,
      number,
      company: draft.company,
      contact: draft.contact,
      email: draft.email,
      timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
      isNew: true,
      archived: false,
      bidCreated: false,
      offerCreated: false,
      equipment: draft.equipment || "Van",
      department: draft.department || department,
      subject: draft.subject || "quote",
      lane: `${draft.pu} → ${draft.del}`,
      body,
      selectedDriverId: null,
      offerTimer: 300,
      driversAvailable: true,
      notified: 0,
      drivers: [],
      broadcast: null,
      form: {
        pu: draft.pu,
        puTime: draft.puTime || "",
        del: draft.del,
        delTime: "",
        miles: "",
        weight: draft.weight || "",
        pallets: draft.pallets || "",
        dims: draft.dims || "",
        rate: "",
        note: "",
        stops: [],
      },
      thread: [{ id: uid("th"), from: "customer", name: draft.contact, time: formatNow(), body }],
    };
    setQuotes((current) => [next, ...current]);
    log(`New bid opened for ${draft.company}`, id);
    setNewBidOpen(false);
    setTab("active");
    setView("board");
    setNav("quotes");
    setModalQuoteId(id);
    pushToast("Quote created — check the lane and rate");
  };

  const moveStage = (id, stage) => {
    patchQuote(id, (quote) => {
      if (stage === "new") {
        return { ...quote, bidCreated: false, offerCreated: false, archived: false };
      }
      if (stage === "bid") {
        return { ...quote, bidCreated: true, offerCreated: false, archived: false, isNew: false };
      }
      const drivers = quote.drivers.length ? quote.drivers : seedDrivers(quote, 4);
      if (stage === "offer") {
        return {
          ...quote,
          bidCreated: true,
          offerCreated: true,
          archived: false,
          isNew: false,
          drivers,
          selectedDriverId: quote.selectedDriverId || drivers[0]?.id,
          broadcast: quote.broadcast || {
            pu: quote.form.pu,
            puWhen: quote.form.puTime || "ASAP",
            del: quote.form.del,
            delWhen: quote.form.delTime || "TBD",
            postedAt: formatNow(),
            rate: Number(quote.form.rate) || 1200,
          },
        };
      }
      const booked = drivers.map((driver, index) =>
        index === 0 ? { ...driver, status: "booked" } : driver
      );
      return {
        ...quote,
        bidCreated: true,
        offerCreated: true,
        archived: false,
        drivers: booked,
        selectedDriverId: booked[0].id,
        broadcast: quote.broadcast || {
          pu: quote.form.pu,
          puWhen: quote.form.puTime || "ASAP",
          del: quote.form.del,
          delWhen: quote.form.delTime || "TBD",
          postedAt: formatNow(),
          rate: 1200,
        },
      };
    });
    pushToast(`Moved to ${stage === "new" ? "New" : stage === "bid" ? "BID created" : stage === "offer" ? "Offer created" : "Booked"}`);
  };

  const applyRate = (value) => {
    setRateSeed({ value, at: Date.now() });
    if (!modalQuoteId && workspaceId) setModalQuoteId(workspaceId);
    setPricingOpen(false);
    pushToast(`Recommended rate ${value} ready to apply`);
  };

  const markNotificationsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  const openNotification = (item) => {
    setNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)));
    if (item.quoteId) {
      const target = quotes.find((quote) => quote.id === item.quoteId);
      if (target?.archived) setTab("archive");
      else setTab("active");
      openWorkspace(item.quoteId);
    }
  };

  const workspaceQuote = quotes.find((quote) => quote.id === workspaceId) || null;
  const modalQuote = quotes.find((quote) => quote.id === modalQuoteId) || null;

  const value = useMemo(
    () => ({
      quotes,
      nav,
      setNav,
      view,
      workspaceId,
      workspaceQuote,
      tab,
      setTab,
      query,
      setQuery,
      statusFilter,
      setStatusFilter,
      dateFilter,
      setDateFilter,
      company,
      setCompany,
      department,
      setDepartment,
      otrOnly,
      setOtrOnly,
      modalQuote,
      modalQuoteId,
      openCheck,
      closeCheck: () => setModalQuoteId(null),
      newBidOpen,
      setNewBidOpen,
      pricingOpen,
      setPricingOpen,
      rateSeed,
      toasts,
      dismissToast,
      pushToast,
      notifications,
      markNotificationsRead,
      openNotification,
      activity,
      sidebarCollapsed,
      setSidebarCollapsed,
      userStatus,
      setUserStatus,
      signedIn,
      setSignedIn,
      openWorkspace,
      closeWorkspace,
      archiveQuote,
      restoreQuote,
      createBid,
      sendCustomerMessage,
      sendDriverMessage,
      selectDriver,
      bookDriver,
      holdDriver,
      toggleDriverCheck,
      setVisibleChecks,
      archiveDrivers,
      restoreDrivers,
      updateOffer,
      renewOffer,
      addQuote,
      moveStage,
      applyRate,
    }),
    [
      quotes,
      nav,
      view,
      workspaceId,
      workspaceQuote,
      tab,
      query,
      statusFilter,
      dateFilter,
      company,
      department,
      otrOnly,
      modalQuote,
      modalQuoteId,
      newBidOpen,
      pricingOpen,
      rateSeed,
      toasts,
      notifications,
      activity,
      sidebarCollapsed,
      userStatus,
      signedIn,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
