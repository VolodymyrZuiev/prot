let seq = 1;
export function uid(prefix = "id") {
  seq += 1;
  return `${prefix}-${seq}`;
}

export const COMPANIES = ["Empire National", "Atlas Freight", "Pacific Haul"];
export const DEPARTMENTS = ["Expedite Department", "OTR Department", "Intermodal"];

export const CITIES = [
  "Minneapolis, MN",
  "Cincinnati, OH",
  "Madera, CA",
  "Lithia Springs, GA",
  "Los Angeles, CA",
  "Atlanta, GA",
  "Dallas, TX",
  "Chicago, IL",
  "Miami, FL",
  "Seattle, WA",
  "Denver, CO",
  "Nashville, TN",
  "Phoenix, AZ",
  "Newark, NJ",
  "Houston, TX",
  "Detroit, MI",
  "Boston, MA",
  "Memphis, TN",
  "Charlotte, NC",
  "Kansas City, MO",
];

const COORDS = {
  minneapolis: [44.9778, -93.265],
  cincinnati: [39.1031, -84.512],
  madera: [36.9613, -120.0607],
  lithia: [33.794, -84.6608],
  "los angeles": [34.0522, -118.2437],
  austin: [30.2672, -97.7431],
  atlanta: [33.749, -84.388],
  dallas: [32.7767, -96.797],
  chicago: [41.8781, -87.6298],
  miami: [25.7617, -80.1918],
  seattle: [47.6062, -122.3321],
  denver: [39.7392, -104.9903],
  nashville: [36.1627, -86.7816],
  phoenix: [33.4484, -112.074],
  newark: [40.7357, -74.1724],
  houston: [29.7604, -95.3698],
  detroit: [42.3314, -83.0458],
  boston: [42.3601, -71.0589],
  memphis: [35.1495, -90.049],
  charlotte: [35.2271, -80.8431],
  "kansas city": [39.0997, -94.5786],
  "san francisco": [37.7749, -122.4194],
  portland: [45.5152, -122.6784],
  "new york": [40.7128, -74.006],
};

export function numFrom(value) {
  const match = String(value ?? "")
    .replace(/,/g, "")
    .match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function findCoord(label) {
  const text = String(label || "").toLowerCase();
  const key = Object.keys(COORDS).find((name) => text.includes(name));
  return key ? COORDS[key] : null;
}

function haversine([lat1, lon1], [lat2, lon2]) {
  const r = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function estimateMiles(locations) {
  const points = locations.map(findCoord).filter(Boolean);
  if (points.length < 2) {
    const seed = locations.join("|");
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return 180 + (hash % 2100);
  }
  let miles = 0;
  for (let i = 1; i < points.length; i += 1) miles += haversine(points[i - 1], points[i]);
  return Math.max(12, Math.round(miles * 1.18));
}

export function recommendRate(miles, weight, equipment = "Van") {
  const perMile = equipment === "OTR" ? 2.05 : equipment === "Sprinter" ? 1.65 : 1.85;
  const milesN = numFrom(miles) || 500;
  const weightN = numFrom(weight) || 400;
  return Math.round((milesN * perMile + weightN * 0.12) / 5) * 5;
}

export function formatMoney(value) {
  const n = Math.round(numFrom(value));
  return `$${n.toLocaleString("en-US")}`;
}

export function formatNow() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

export function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function stageOf(quote) {
  if (quote.drivers?.some((driver) => driver.status === "booked")) return "booked";
  if (quote.offerCreated) return "offer";
  if (quote.bidCreated) return "bid";
  return "new";
}

export function lastPreview(driver) {
  const text = [...(driver.messages || [])].reverse().find((message) => message.type === "text");
  if (!text) return "";
  return text.from === "me" ? `You: ${text.text}` : text.text;
}

function driverMessage(partial) {
  return { id: uid("msg"), time: "05/05/2024 9:02 AM", ...partial };
}

function makeDriver(partial) {
  return {
    checked: false,
    status: "bidding",
    holdBy: "",
    tags: [],
    badge: "",
    flag: "",
    company: "Independent",
    companyCode: "04",
    rating: 8.4,
    milesAway: 12,
    rate: 1200,
    note: "",
    eta: "2h : 10m",
    etaAt: "08:15 PM (CDT, GMT-5)",
    location: "Dallas, TX",
    details: { miles: 640, weight: 1200, pallets: 2, dims: "48x40x48" },
    messages: [],
    ...partial,
  };
}

const JJ_DRIVERS = [
  makeDriver({
    id: "jj-d0",
    code: "2323",
    name: "John Driver",
    state: "TX",
    rating: 9.72,
    score: "72.61",
    flag: "CA",
    tags: ["Only ING", "Other company sticker"],
    company: "Roger Holloway LLC",
    companyCode: "11",
    milesAway: 4.2,
    rate: 1050,
    status: "accepted",
    note: "can pick up the load earlier",
    eta: "1h : 30m",
    etaAt: "06:47 PM (CDT, GMT-5)",
    location: "Coeur d'Alene, ID 83814",
    details: { miles: 891, weight: 1500, pallets: 2, dims: "48x48x48" },
    messages: [
      driverMessage({ type: "event", text: "John Driver accepted offer" }),
      driverMessage({
        type: "offer",
        eta: "1h : 30m",
        etaAt: "06:47 PM (CDT, GMT-5)",
        rate: 1050,
        note: "can pick up the load earlier",
        location: "Coeur d'Alene, ID 83814",
      }),
    ],
  }),
  makeDriver({
    id: "jj-d1",
    code: "2333",
    name: "John Driver",
    state: "TX",
    rating: 9.76,
    badge: "RB",
    milesAway: 6.9,
    rate: 1200,
    status: "hold",
    holdBy: "Anna Lu",
    company: "Redbird Express",
    companyCode: "08",
    location: "Dallas, TX",
    messages: [driverMessage({ type: "event", text: "Offer placed on hold", time: "05/05/2024 8:41 AM" })],
  }),
  makeDriver({
    id: "jj-d2",
    code: "1422",
    name: "Tom Rob",
    state: "OK",
    rating: 8.71,
    milesAway: 7.2,
    rate: 1200,
    status: "accepted",
    company: "Tom Rob Trucking",
    messages: [driverMessage({ type: "event", text: "Tom Rob accepted offer", time: "05/05/2024 8:12 AM" })],
  }),
  makeDriver({
    id: "jj-d3",
    code: "4122",
    name: "Sam Robson",
    state: "GA",
    rating: 7.44,
    milesAway: 11.4,
    rate: 1200,
    status: "accepted",
    company: "Robson Logistics",
    messages: [driverMessage({ type: "event", text: "Sam Robson accepted offer", time: "05/05/2024 7:55 AM" })],
  }),
  makeDriver({
    id: "jj-d4",
    code: "5221",
    name: "Walter White",
    state: "NM",
    rating: 7.13,
    milesAway: 12.4,
    rate: 1200,
    company: "Southwest Van Lines",
    companyCode: "19",
  }),
  makeDriver({
    id: "jj-d5",
    code: "1244",
    name: "Robert Robson",
    state: "AL",
    rating: 9.46,
    milesAway: 65.1,
    rate: 1250,
    company: "Robson & Co",
    messages: [driverMessage({ type: "text", from: "me", text: "Some text", time: "05/05/2024 8:05 AM" })],
  }),
];

const NAME_POOL = [
  ["3188", "Elena Vasquez", "AZ", "Cactus Expedite"],
  ["2901", "Chris Dalton", "TN", "Dalton Direct"],
  ["1740", "Mike Chen", "IL", "Lakeshore Transit"],
  ["4410", "Priya Shah", "NJ", "Harbor Sprinters"],
  ["2677", "Noah Blake", "CO", "Front Range Freight"],
  ["1550", "Luis Ortega", "TX", "Ortega OTR"],
  ["4882", "Hannah Cole", "GA", "Peach State Vans"],
  ["2094", "Owen Brooks", "OH", "Brooks Hotshot"],
];

export function seedDrivers(quote, count = 5) {
  const start = quote.number ? Number(String(quote.number).slice(-1)) : 1;
  return Array.from({ length: count }, (_, index) => {
    const [code, name, state, company] = NAME_POOL[(start + index) % NAME_POOL.length];
    const milesAway = Math.round((3 + ((start + index * 3) % 40) + index * 1.4) * 10) / 10;
    const rate = 980 + ((start * 37 + index * 55) % 420);
    return makeDriver({
      id: uid("drv"),
      code,
      name,
      state,
      company,
      companyCode: String(10 + index),
      rating: Math.round((7 + ((index * 0.37) % 2.6)) * 100) / 100,
      milesAway,
      rate,
      status: index === 0 ? "accepted" : "bidding",
      location: index % 2 === 0 ? quote.form?.pu || "Dallas, TX" : "En route",
      details: {
        miles: numFrom(quote.form?.miles) || 640,
        weight: numFrom(quote.form?.weight) || 900,
        pallets: numFrom(quote.form?.pallets) || 1,
        dims: quote.form?.dims || "48x40x48",
      },
      messages:
        index === 0
          ? [driverMessage({ type: "event", text: `${name} accepted offer`, time: formatNow() })]
          : [],
    });
  });
}

function quote(partial) {
  return {
    isNew: false,
    archived: false,
    bidCreated: false,
    offerCreated: false,
    equipment: "Van",
    department: "Expedite Department",
    subject: "quote",
    selectedDriverId: null,
    offerTimer: 294,
    driversAvailable: true,
    notified: 26,
    thread: [],
    drivers: [],
    broadcast: null,
    ...partial,
  };
}

const geBody = [
  { type: "subject", value: "quote" },
  { type: "text", value: "Madera CA to Lithia spring GA" },
  { type: "text", value: "Can I get a spring van, material is ready now in Madera CA pickup ASAP" },
  { type: "text", value: "1 PALLET 31X47X23= 443 LBS" },
  { type: "text", value: "Lithia Springs GA 30122" },
];

const ibmBody = [
  { type: "subject", value: "quote" },
  { type: "text", value: "PICKUP TIME:", strong: true },
  { type: "text", value: "Dec 01, 2025, 20:30 PST" },
  { type: "text", value: "DELIVER BY:", strong: true },
  { type: "text", value: "Dec 02, 2025, 12:00 CST" },
  { type: "text", value: "DELIVERY INSTRUCTIONS:", strong: true },
  { type: "text", value: "None" },
  { type: "text", value: "AIR WAYBILLS:", strong: true },
  { type: "text", value: "235-95087705" },
  { type: "text", value: "Order details", strong: true },
  { type: "text", value: "ORDER REFERENCES:", strong: true },
  { type: "text", value: "PICKUP ADDRESS:", strong: true },
  { type: "text", value: "Turkish Airlines" },
  { type: "text", value: "SWISSPORT" },
  { type: "text", value: "5871 West Imperial Highway" },
  { type: "text", value: "Los Angeles, CA 90045" },
  { type: "text", value: "United States of America" },
  { type: "text", value: "DELIVERY ADDRESS:", strong: true },
  { type: "text", value: "IBM Building 2, dock 4" },
  { type: "text", value: "Austin, TX 78758" },
];

const jjBody = [
  { type: "subject", value: "quote" },
  { type: "text", value: "AIRLINE ACCOUNT NUMBER:", strong: true },
  { type: "text", value: "01119230011 (Turkish Airlines)" },
  { type: "text", value: "VEHICLE TYPE: VAN", strong: true },
  { type: "text", value: "DANGEROUS GOODS: NO" },
  { type: "text", value: "TOTAL PIECES: 4" },
  { type: "text", value: "TOTAL WEIGHT: 157.00 KG" },
  { type: "text", value: "2 of 120.0 x 80.0 x 101.0 CM @ 60.0 KG each" },
  { type: "text", value: "Commodity: Other - Automotive Parts" },
  { type: "text", value: "IDs: ATE9NCD223, AT7Y26GPTZ" },
  { type: "text", value: "1 of 60.0 x 41.0 x 30.0 CM @ 7.0 KG" },
  { type: "text", value: "Commodity: Other - Automotive Parts" },
  { type: "text", value: "ID: ATFD64dJA3" },
  { type: "text", value: "1 of 120.0 x 80.0 x 45.0 CM @ 30.0 KG" },
  { type: "text", value: "Commodity: Other - Automotive Parts" },
  { type: "text", value: "ID: ATF4JFKDZ6" },
];

const jjLaneBody = [
  { type: "subject", value: "quote" },
  { type: "text", value: "Madera CA to Lithia spring GA" },
  { type: "text", value: "Can I get a spring van, material is ready now in Madera CA pickup ASAP" },
  { type: "text", value: "1 PALLET 31X47X23= 443 LBS" },
  { type: "text", value: "Lithia Springs GA 30122" },
];

export const INITIAL_QUOTES = [
  quote({
    id: "q-ge",
    number: "1182044",
    company: "General Electric",
    contact: "Ethan Carter",
    email: "jane.doe456@example.com",
    timestamp: "2020-05-04 08:16:16",
    isNew: true,
    lane: "Madera, CA → Lithia Springs, GA",
    body: geBody,
    form: {
      pu: "Madera, CA",
      puTime: "ASAP",
      del: "Lithia Springs, GA",
      delTime: "",
      miles: "",
      weight: "443 lbs",
      pallets: "1 pallet",
      dims: "31 x 47 x 23",
      rate: "",
      note: "",
      stops: [],
    },
    thread: [
      { id: "ge-t1", from: "customer", name: "Ethan Carter", time: "2020-05-04 08:16:16", body: geBody },
    ],
  }),
  quote({
    id: "q-ibm",
    number: "1183390",
    company: "IBM",
    contact: "Cody Fisher",
    email: "nevaeh.simmons@example.com",
    timestamp: "2025-05-03 08:14:01",
    isNew: true,
    lane: "Los Angeles, CA → Austin, TX",
    body: ibmBody,
    equipment: "Sprinter",
    form: {
      pu: "Los Angeles, CA",
      puTime: "Dec 01, 2025, 20:30 PST",
      del: "Austin, TX",
      delTime: "Dec 02, 2025, 12:00 CST",
      miles: "",
      weight: "",
      pallets: "1",
      dims: "",
      rate: "",
      note: "Air waybill 235-95087705",
      stops: [],
    },
    thread: [{ id: "ibm-t1", from: "customer", name: "Cody Fisher", time: "2025-05-03 08:14:01", body: ibmBody }],
  }),
  quote({
    id: "q-jj",
    number: "1245352",
    company: "Johnson & Johnson",
    contact: "Brooklyn Simmons",
    email: "debra.holt@example.com",
    timestamp: "2020-05-05 10:21:13",
    isNew: false,
    bidCreated: true,
    offerCreated: true,
    lane: "Dallas, TX → Atlanta, GA",
    body: jjLaneBody,
    selectedDriverId: "jj-d0",
    form: {
      pu: "Minneapolis, MN",
      puTime: "3/12",
      del: "Cincinnati, OH",
      delTime: "",
      miles: "700",
      weight: "380 lbs",
      pallets: "10 ft - Full (7?)",
      dims: "",
      rate: "",
      note: "",
      stops: [],
    },
    broadcast: {
      pu: "Dallas TX, 75001",
      puWhen: "ASAP",
      del: "Atlanta, GA, 30033",
      delWhen: "Tomorrow by 5:00 PM",
      postedAt: "05/05/2014 13:13",
      rate: 1200,
    },
    drivers: JJ_DRIVERS,
    thread: [
      { id: "jj-t1", from: "customer", name: "Brooklyn Simmons", time: "2020-05-05 10:21:13", body: jjLaneBody },
      {
        id: "jj-t2",
        from: "customer",
        name: "Brooklyn Simmons",
        time: "2020-05-05 11:02:44",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Madera CA to Lithia spring GA" },
          { type: "text", value: "Following up — material is staged and ready for a spring van ASAP." },
          { type: "text", value: "1 PALLET 31X47X23= 443 LBS" },
          { type: "text", value: "Lithia Springs GA 30122" },
        ],
      },
      {
        id: "jj-t3",
        from: "customer",
        name: "Brooklyn Simmons",
        time: "2020-05-05 12:18:02",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Please confirm if a straight van can still make Dallas tonight." },
          { type: "text", value: "1 PALLET 31X47X23= 443 LBS" },
        ],
      },
    ],
  }),
  quote({
    id: "q-jj2",
    number: "1245401",
    company: "Johnson & Johnson",
    contact: "Brooklyn Simmons",
    email: "debra.holt@example.com",
    timestamp: "2020-05-05 14:02:11",
    bidCreated: true,
    offerCreated: true,
    lane: "Nashville, TN → Newark, NJ",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Nashville TN to Newark NJ" },
      { type: "text", value: "2 pallets automotive parts, no dangerous goods." },
      { type: "text", value: "Dock closes 16:00 local." },
    ],
    form: {
      pu: "Nashville, TN",
      puTime: "Today 14:00",
      del: "Newark, NJ",
      delTime: "Tomorrow 10:00",
      miles: "760",
      weight: "900 lbs",
      pallets: "2",
      dims: "48 x 40 x 48",
      rate: "1650",
      note: "Dock closes 16:00",
      stops: [],
    },
    broadcast: {
      pu: "Nashville, TN",
      puWhen: "Today 14:00",
      del: "Newark, NJ",
      delWhen: "Tomorrow 10:00",
      postedAt: "05/05/2020 14:10",
      rate: 1650,
    },
    thread: [
      {
        id: "jj2-t1",
        from: "customer",
        name: "Brooklyn Simmons",
        time: "2020-05-05 14:02:11",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Nashville TN to Newark NJ" },
          { type: "text", value: "2 pallets automotive parts, no dangerous goods." },
        ],
      },
    ],
  }),
  quote({
    id: "q-ebay",
    number: "1098821",
    company: "eBay",
    contact: "Esther Howard",
    email: "deanna.curtis@example.com",
    timestamp: "2020-05-03 08:14:01",
    isNew: true,
    lane: "Phoenix, AZ → Denver, CO",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Phoenix AZ to Denver CO" },
      { type: "text", value: "Need a sprinter for 6 cartons of returns, pickup after 11:00." },
      { type: "text", value: "6 PCS / 210 LBS" },
      { type: "text", value: "Denver, CO 80216" },
    ],
    equipment: "Sprinter",
    form: {
      pu: "Phoenix, AZ",
      puTime: "After 11:00",
      del: "Denver, CO",
      delTime: "",
      miles: "",
      weight: "210 lbs",
      pallets: "6 pcs",
      dims: "",
      rate: "",
      note: "",
      stops: [],
    },
    thread: [
      {
        id: "eb-t1",
        from: "customer",
        name: "Esther Howard",
        time: "2020-05-03 08:14:01",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Phoenix AZ to Denver CO" },
          { type: "text", value: "Need a sprinter for 6 cartons of returns, pickup after 11:00." },
          { type: "text", value: "6 PCS / 210 LBS" },
        ],
      },
    ],
  }),
  quote({
    id: "q-mc",
    number: "1200448",
    company: "MasterCard",
    contact: "Darlene Robertson",
    email: "willie.jennings@example.com",
    timestamp: "2020-05-06 11:24:08",
    equipment: "OTR",
    department: "OTR Department",
    bidCreated: true,
    lane: "Chicago, IL → Boston, MA",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Chicago IL to Boston MA" },
      { type: "text", value: "Secure cage required. 4 pallets of kiosk hardware." },
      { type: "text", value: "TOTAL WEIGHT: 2,400 LBS" },
    ],
    form: {
      pu: "Chicago, IL",
      puTime: "05/07 08:00",
      del: "Boston, MA",
      delTime: "05/08 18:00",
      miles: "983",
      weight: "2400 lbs",
      pallets: "4",
      dims: "48 x 40 x 60",
      rate: "2100",
      note: "Secure cage",
      stops: [],
    },
    broadcast: {
      pu: "Chicago, IL",
      puWhen: "05/07 08:00",
      del: "Boston, MA",
      delWhen: "05/08 18:00",
      postedAt: "05/06/2020 11:40",
      rate: 2100,
    },
    thread: [
      {
        id: "mc-t1",
        from: "customer",
        name: "Darlene Robertson",
        time: "2020-05-06 11:24:08",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Chicago IL to Boston MA" },
          { type: "text", value: "Secure cage required. 4 pallets of kiosk hardware." },
        ],
      },
    ],
  }),
  quote({
    id: "q-lv",
    number: "1177602",
    company: "Louis Vuitton",
    contact: "Darrell Steward",
    email: "jessica.hanson@example.com",
    timestamp: "2020-05-02 07:10:15",
    equipment: "OTR",
    department: "OTR Department",
    lane: "Miami, FL → Houston, TX",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Miami FL to Houston TX" },
      { type: "text", value: "White glove, no box labels facing the dock." },
      { type: "text", value: "3 PALLETS / 1,100 LBS" },
    ],
    form: {
      pu: "Miami, FL",
      puTime: "",
      del: "Houston, TX",
      delTime: "",
      miles: "",
      weight: "1100 lbs",
      pallets: "3",
      dims: "48 x 40 x 50",
      rate: "",
      note: "White glove",
      stops: [],
    },
    thread: [
      {
        id: "lv-t1",
        from: "customer",
        name: "Darrell Steward",
        time: "2020-05-02 07:10:15",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Miami FL to Houston TX" },
          { type: "text", value: "White glove, no box labels facing the dock." },
          { type: "text", value: "3 PALLETS / 1,100 LBS" },
        ],
      },
    ],
  }),
  quote({
    id: "q-hd",
    number: "1219007",
    company: "Home Depot",
    contact: "Cameron Walsh",
    email: "cameron.walsh@example.com",
    timestamp: "2025-04-28 16:42:09",
    isNew: true,
    equipment: "OTR",
    lane: "Atlanta, GA → Memphis, TN",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Atlanta GA to Memphis TN" },
      { type: "text", value: "Store reset freight. Liftgate at delivery." },
      { type: "text", value: "8 PALLETS / 6,200 LBS" },
    ],
    form: {
      pu: "Atlanta, GA",
      puTime: "04/29 06:00",
      del: "Memphis, TN",
      delTime: "04/29 18:00",
      miles: "",
      weight: "6200 lbs",
      pallets: "8",
      dims: "48 x 40 x 70",
      rate: "",
      note: "Liftgate",
      stops: [],
    },
    thread: [
      {
        id: "hd-t1",
        from: "customer",
        name: "Cameron Walsh",
        time: "2025-04-28 16:42:09",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Atlanta GA to Memphis TN" },
          { type: "text", value: "Store reset freight. Liftgate at delivery." },
          { type: "text", value: "8 PALLETS / 6,200 LBS" },
        ],
      },
    ],
  }),
  quote({
    id: "q-jj3",
    number: "1245518",
    company: "Johnson & Johnson",
    contact: "Brooklyn Simmons",
    email: "debra.holt@example.com",
    timestamp: "2020-05-06 09:12:33",
    bidCreated: true,
    offerCreated: true,
    lane: "Detroit, MI → Charlotte, NC",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Detroit MI to Charlotte NC" },
      { type: "text", value: "Sample kits, 1 pallet, exclusive use van." },
    ],
    form: {
      pu: "Detroit, MI",
      puTime: "ASAP",
      del: "Charlotte, NC",
      delTime: "Next day",
      miles: "610",
      weight: "320 lbs",
      pallets: "1",
      dims: "40 x 40 x 36",
      rate: "980",
      note: "",
      stops: [],
    },
    broadcast: {
      pu: "Detroit, MI",
      puWhen: "ASAP",
      del: "Charlotte, NC",
      delWhen: "Next day",
      postedAt: "05/06/2020 09:20",
      rate: 980,
    },
    thread: [
      {
        id: "jj3-t1",
        from: "customer",
        name: "Brooklyn Simmons",
        time: "2020-05-06 09:12:33",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Detroit MI to Charlotte NC" },
          { type: "text", value: "Sample kits, 1 pallet, exclusive use van." },
        ],
      },
    ],
  }),
  quote({
    id: "q-ba",
    number: "1300114",
    company: "Boeing",
    contact: "Jerome Fox",
    email: "jerome.fox@example.com",
    timestamp: "2025-06-11 13:05:44",
    isNew: true,
    equipment: "Sprinter",
    lane: "Seattle, WA → Denver, CO",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Seattle WA to Denver CO" },
      { type: "text", value: "AOG part, must depart within 2 hours of award." },
      { type: "text", value: "1 CRATE 24X18X12 = 86 LBS" },
    ],
    form: {
      pu: "Seattle, WA",
      puTime: "Within 2 hours",
      del: "Denver, CO",
      delTime: "",
      miles: "",
      weight: "86 lbs",
      pallets: "1 crate",
      dims: "24 x 18 x 12",
      rate: "",
      note: "AOG",
      stops: [],
    },
    thread: [
      {
        id: "ba-t1",
        from: "customer",
        name: "Jerome Fox",
        time: "2025-06-11 13:05:44",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Seattle WA to Denver CO" },
          { type: "text", value: "AOG part, must depart within 2 hours of award." },
          { type: "text", value: "1 CRATE 24X18X12 = 86 LBS" },
        ],
      },
    ],
  }),
  quote({
    id: "q-nike",
    number: "1044200",
    company: "Nike",
    contact: "Alicia Nguyen",
    email: "alicia.nguyen@example.com",
    timestamp: "2020-04-18 15:22:01",
    archived: true,
    bidCreated: true,
    offerCreated: true,
    lane: "Memphis, TN → Miami, FL",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Memphis TN to Miami FL — archived after delivery." },
      { type: "text", value: "12 cartons / 640 LBS" },
    ],
    form: {
      pu: "Memphis, TN",
      puTime: "04/18 18:00",
      del: "Miami, FL",
      delTime: "04/20 09:00",
      miles: "990",
      weight: "640 lbs",
      pallets: "12 ctns",
      dims: "24 x 18 x 16",
      rate: "1400",
      note: "Delivered",
      stops: [],
    },
    thread: [
      {
        id: "nk-t1",
        from: "customer",
        name: "Alicia Nguyen",
        time: "2020-04-18 15:22:01",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Memphis TN to Miami FL — archived after delivery." },
        ],
      },
    ],
  }),
  quote({
    id: "q-fx",
    number: "1021188",
    company: "FedEx",
    contact: "Marcus Hale",
    email: "marcus.hale@example.com",
    timestamp: "2020-03-02 09:01:27",
    archived: true,
    equipment: "OTR",
    department: "OTR Department",
    lane: "Kansas City, MO → Houston, TX",
    body: [
      { type: "subject", value: "quote" },
      { type: "text", value: "Kansas City MO to Houston TX" },
      { type: "text", value: "Overflow linehaul. Customer cancelled before award." },
    ],
    form: {
      pu: "Kansas City, MO",
      puTime: "",
      del: "Houston, TX",
      delTime: "",
      miles: "740",
      weight: "18000 lbs",
      pallets: "FTL",
      dims: "",
      rate: "",
      note: "Cancelled",
      stops: [],
    },
    thread: [
      {
        id: "fx-t1",
        from: "customer",
        name: "Marcus Hale",
        time: "2020-03-02 09:01:27",
        body: [
          { type: "subject", value: "quote" },
          { type: "text", value: "Kansas City MO to Houston TX" },
          { type: "text", value: "Overflow linehaul. Customer cancelled before award." },
        ],
      },
    ],
  }),
];

INITIAL_QUOTES.forEach((item) => {
  if (item.bidCreated && item.drivers.length === 0) {
    item.drivers = seedDrivers(item, 4);
    item.selectedDriverId = item.drivers[0]?.id || null;
  }
});

export const INITIAL_NOTIFICATIONS = [
  { id: "n1", unread: true, title: "New quote from eBay", detail: "Phoenix, AZ → Denver, CO", quoteId: "q-ebay", time: "2m ago" },
  { id: "n2", unread: true, title: "John Driver accepted offer", detail: "Quote #1245352 · $1,050", quoteId: "q-jj", time: "18m ago" },
  { id: "n3", unread: false, title: "IBM sent pickup details", detail: "Air waybill 235-95087705", quoteId: "q-ibm", time: "1h ago" },
];

export const TEAM = [
  { name: "Andrew Jameson", role: "Dispatcher", status: "Online" },
  { name: "Anna Lu", role: "Carrier sales", status: "Online" },
  { name: "Robert Nelson", role: "Expedite desk", status: "Away" },
  { name: "Priya Shah", role: "OTR desk", status: "Online" },
];

export const QUICK_REPLIES = ["You are welcome", "Thank you", "Please, share your current location"];

export function driverReplyFor(text) {
  const value = text.toLowerCase();
  if (value.includes("location")) return "I'm 6 miles from the pickup, rolling now.";
  if (value.includes("thank")) return "Anytime. Standing by for the next update.";
  if (value.includes("welcome")) return "Copy. I'll keep you posted.";
  if (value.includes("hold")) return "Understood, I'll wait for your release.";
  return "Copy that. I'll confirm shortly.";
}
