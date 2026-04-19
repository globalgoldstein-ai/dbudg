// D-Budg | Session 4 | Build 2 | 2026-04-19 09:00 ET | Fix rentSelected reference in Total Nest Egg tile

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const SEED_DMV = {
  rent: 2100, hoa: 0, insurance: 30, utilities: 200, uber: 200,
  medication: 400, housekeeper: 200, cable: 75, mobile: 50,
  cigarettes: 280, groceries: 800, personal: 400,
};

const DMV_LABELS = {
  rent: "Rent", hoa: "HOA", insurance: "Home / Renters Insurance",
  utilities: "Utilities", uber: "Uber / Transit", medication: "Medical",
  housekeeper: "Housekeeper", cable: "Cable / Internet", mobile: "Mobile Phone",
  cigarettes: "Cigarettes", groceries: "Groceries", personal: "Skin Care, Hair & Clothing",
};

const SEED_HOUSE = {
  salePrice: 255000, mortgagePayoff: 46812.67, transactionCosts: 14311.47,
  repairs: 0, moving: 10000, condoPrice: 300000, downPayment: 100000,
  capGainsRate: 0, rentInstead: true,
  fidelityBalance: 75883, fidelityDate: "April 2026",
  joshGift: 30000,
};

const SEED_INCOME = { socialSecurity: 1900 };
const SEED_PROJ = { strategy: "moneyMarket", returnPct: 2.5, inflationPct: 2.5, manualReturn: false };
const STARTING_AGE = 78;
const PROJECTION_YEARS = 25;

const LS = {
  get: (key, fallback) => {
    try { const v = localStorage.getItem("dbudg-" + key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => { try { localStorage.setItem("dbudg-" + key, JSON.stringify(val)); } catch {} },
};

const fmt = (n) => {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? "-$" : "$") + abs.toLocaleString("en-US");
};

const sumObj = (obj) => Object.values(obj).reduce((a, b) => a + Number(b || 0), 0);

function calcHouseNet(h) {
  const gross = h.salePrice - h.mortgagePayoff - h.transactionCosts - h.repairs - h.moving;
  const tax = Math.max(0, h.salePrice - h.mortgagePayoff) * (h.capGainsRate / 100);
  const net = gross - tax;
  return h.rentInstead ? net : net - h.downPayment;
}

function buildProjectionLine(nestEgg, monthlyDraw, returnPct, inflationPct) {
  const data = [];
  let balance = nestEgg, draw = monthlyDraw;
  const mReturn = returnPct / 100 / 12, mInflation = inflationPct / 100 / 12;
  for (let yr = 0; yr <= PROJECTION_YEARS; yr++) {
    data.push({ yr, age: STARTING_AGE + yr, balance: Math.round(balance) });
    if (yr === PROJECTION_YEARS) break;
    for (let m = 0; m < 12; m++) { balance = balance * (1 + mReturn) - draw; draw *= (1 + mInflation); }
  }
  return data;
}

function calcTargetDraw(nestEgg, returnPct, inflationPct) {
  const mReturn = returnPct / 100 / 12;
  const mInflation = inflationPct / 100 / 12;
  function months(draw) {
    let bal = nestEgg, d = draw, m = 0;
    while (bal > 0 && m < 1200) { bal = bal * (1 + mReturn) - d; d *= (1 + mInflation); m++; }
    return m;
  }
  let lo = 0, hi = nestEgg;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    if (months(mid) > 120) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function calcTotalDraws(monthlyDraw, inflationPct, totalMonths) {
  let total = 0, draw = monthlyDraw;
  const mInflation = inflationPct / 100 / 12;
  for (let m = 0; m < totalMonths; m++) { total += draw; draw *= (1 + mInflation); }
  return total;
}

function calcTotalExpenses(monthlyExpenses, inflationPct, totalMonths) {
  let total = 0, exp = monthlyExpenses;
  const mInflation = inflationPct / 100 / 12;
  for (let m = 0; m < totalMonths; m++) { total += exp; exp *= (1 + mInflation); }
  return total;
}

function NumInput({ val, onChange, pct }) {
  const [focused, setFocused] = useState(false);
  const display = focused
    ? (val === 0 ? "" : String(val))
    : Number(val).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return (
    <div style={{ position: "relative" }}>
      {!pct && <span style={S.dollar}>$</span>}
      <input
        type="text"
        inputMode="decimal"
        style={{ ...S.numInput, ...(pct ? { paddingLeft: 10, paddingRight: 28, width: 96 } : {}) }}
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => {
          const raw = e.target.value.replace(/,/g, "");
          const n = parseFloat(raw);
          onChange(isNaN(n) ? 0 : n);
        }}
      />
      {pct && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#9A8060", fontSize: 17, pointerEvents: "none" }}>%</span>}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [dmv, setDmv] = useState(() => LS.get("dmv", SEED_DMV));
  const [income, setIncome] = useState(() => LS.get("income", SEED_INCOME));
  const [house, setHouse] = useState(() => ({ ...SEED_HOUSE, ...LS.get("house", {}) }));
  const [proj, setProj] = useState(() => LS.get("proj", SEED_PROJ));

  useEffect(() => LS.set("dmv", dmv), [dmv]);
  useEffect(() => LS.set("income", income), [income]);
  useEffect(() => LS.set("house", house), [house]);
  useEffect(() => LS.set("proj", proj), [proj]);

  const monthlyExpenses = sumObj(dmv);
  const fidelityWithdrawal = Math.max(0, monthlyExpenses - income.socialSecurity);
  const monthlyDraw = fidelityWithdrawal;
  const houseNetRent = calcHouseNet({ ...house, rentInstead: true });
  const houseNetBuy = calcHouseNet({ ...house, rentInstead: false });
  const houseNet = house.rentInstead ? houseNetRent : houseNetBuy;
  const nestEgg = (house.fidelityBalance || 75883) + houseNet - (house.joshGift || 0);

  const runway = (() => {
    let bal = nestEgg, draw = monthlyDraw;
    const mReturn = proj.returnPct / 100 / 12, mInflation = proj.inflationPct / 100 / 12;
    let months = 0;
    while (bal > 0 && months < 1200) { bal = bal * (1 + mReturn) - draw; draw *= (1 + mInflation); months++; }
    if (months >= 1200) return { years: 99, months: 0, totalMonths: 1200, date: null };
    const d = new Date(); d.setMonth(d.getMonth() + months);
    return { years: Math.floor(months / 12), months: months % 12, totalMonths: months, date: d };
  })();

  const targetDraw = calcTargetDraw(nestEgg, proj.returnPct, proj.inflationPct);
  const tenYrDelta = monthlyDraw - targetDraw;

  const totalSS = income.socialSecurity * runway.totalMonths;
  const totalFidelityDraws = calcTotalDraws(monthlyDraw, proj.inflationPct, runway.totalMonths);
  const totalIncome = totalSS + totalFidelityDraws;
  const totalExpenses = calcTotalExpenses(monthlyExpenses, proj.inflationPct, runway.totalMonths);

  const resetAll = () => { setDmv(SEED_DMV); setIncome(SEED_INCOME); setHouse(SEED_HOUSE); setProj(SEED_PROJ); };

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <Nav screen={screen} setScreen={setScreen} />
      <div style={S.wrap}>
        {screen === "dashboard" && (
          <Dashboard
            nestEgg={nestEgg} houseNetRent={houseNetRent} houseNetBuy={houseNetBuy}
            house={house} setHouse={setHouse} monthlyDraw={monthlyDraw} runway={runway}
            tenYrDelta={tenYrDelta} proj={proj} setProj={setProj}
            totalIncome={totalIncome} totalExpenses={totalExpenses}
          />
        )}
        {screen === "budget" && <Budget dmv={dmv} setDmv={setDmv} income={income} setIncome={setIncome} fidelityWithdrawal={fidelityWithdrawal} resetAll={resetAll} />}
        {screen === "house" && <HouseDeal house={house} setHouse={setHouse} houseNet={houseNet} />}
        {screen === "projection" && <Projection nestEgg={nestEgg} monthlyDraw={monthlyDraw} proj={proj} setProj={setProj} />}
      </div>
    </div>
  );
}

function Nav({ screen, setScreen }) {
  const tabs = [["dashboard", "Dashboard"], ["budget", "Budget"], ["house", "House Sale"], ["projection", "Cash & Investments"]];
  return (
    <nav style={S.nav}>
      <div style={S.brand}>D·Budg</div>
      <div style={S.tabs}>
        {tabs.map(([id, label]) => (
          <button key={id} style={{ ...S.tab, ...(screen === id ? S.tabActive : {}) }} onClick={() => setScreen(id)}>{label}</button>
        ))}
      </div>
    </nav>
  );
}

function JoshTile({ house, setHouse }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  return (
    <div style={{ ...S.stat, background: "#FFF0F0", border: "2px solid #C0392B", cursor: "pointer" }}
      onClick={() => { if (!editing) { setRaw(String(house.joshGift || 0)); setEditing(true); } }}>
      <div style={{ ...S.statLbl, color: "#9A8060" }}>Josh Gift for Downpayment</div>
      {editing ? (
        <div style={{ position: "relative", margin: "6px auto", width: 120 }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9A8060", fontSize: 17 }}>$</span>
          <input
            type="text" inputMode="decimal" autoFocus
            style={{ ...S.numInput, width: 120, fontSize: 20, textAlign: "right" }}
            value={raw}
            onChange={e => setRaw(e.target.value.replace(/,/g, ""))}
            onBlur={() => { const n = parseFloat(raw); setHouse(h => ({ ...h, joshGift: isNaN(n) ? 0 : n })); setEditing(false); }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setEditing(false); }}
          />
        </div>
      ) : (
        <div style={{ ...S.statVal, color: "#C0392B" }}>{fmt(house.joshGift || 0)}</div>
      )}
      <div style={{ ...S.statSub, color: "#9A8060" }}>{editing ? "Tap away to save" : "Tap to edit · reduces nest egg"}</div>
    </div>
  );
}

function Dashboard({ nestEgg, houseNetRent, houseNetBuy, house, setHouse, monthlyDraw, runway, tenYrDelta, proj, setProj, totalIncome, totalExpenses }) {
  const runoutSoon = runway.date && runway.years < 5;
const [cityToast, setCityToast] = useState(null);

  const handleCityTap = (city) => {
    setCityToast(city);
    setTimeout(() => setCityToast(null), 2000);
  };

  const toggleStrategy = () => {
    if (proj.strategy === "moneyMarket") {
      setProj(p => ({ ...p, strategy: "fisher", returnPct: 5, manualReturn: false }));
    } else {
      setProj(p => ({ ...p, strategy: "moneyMarket", returnPct: 2.5, manualReturn: false }));
    }
  };

  const stratLabel = proj.strategy === "fisher" ? "Fidelity Portfolio  5%" : "Money Market  2.5%";
  const runwayLabel = runway.years >= 99 ? "100+ years" : runway.years + "y " + runway.months + "m";

  return (
    <div>
      <div style={S.heroWrap}>
        <div style={{ ...S.heroBg, backgroundImage: "url(/denise.jpg), linear-gradient(135deg,#8B6914 0%,#C9A84C 40%,#F5DEB3 70%,#C9A84C 100%)" }} />
        <div style={S.heroShade} />
        <div style={{ position: "absolute", top: 16, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 20px", zIndex: 10 }}>
          <button style={S.cityBtn} onClick={() => handleCityTap("LA")}>
            {cityToast === "LA" ? "✨ Coming Soon" : "🌴 LA Scenario"}
          </button>
          <button style={S.cityBtn} onClick={() => handleCityTap("DC")}>
            {cityToast === "DC" ? "✨ Coming Soon" : "🏛 DC Scenario"}
          </button>
        </div>
        <div style={S.heroText}>
          <div style={S.heroRunway}>{runway.years >= 99 ? "∞" : runway.years + "y " + runway.months + "m"}</div>
          <div style={S.heroSub}>Runway Remaining</div>
          {runway.date && (
            <div style={{ ...S.heroRunout, color: runoutSoon ? "#FF6868" : "#F5DEB3" }}>
              Money runs out: {runway.date.toLocaleString("default", { month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      </div>
      <div style={S.statGrid}>
        <Stat label="Fidelity Account" value={fmt(house.fidelityBalance)} sub={"As of " + house.fidelityDate} />
<Stat label="House Proceeds" value={fmt(houseNetRent)} sub="Rent Scenario" />
        <JoshTile house={house} setHouse={setHouse} />
       <Stat label="Total Nest Egg After House Sale" value={fmt(nestEgg)} sub="Rent scenario" theme="gold" />
        <Stat label="Monthly Draw" value={fmt(monthlyDraw)} sub="From nest egg (expenses − SS)" theme="danger" />
        <Stat
          label="To Last 10 Years"
          value={fmt(Math.abs(tenYrDelta))}
          sub={tenYrDelta > 0.5 ? "Cut per month" : tenYrDelta < -0.5 ? "Monthly headroom" : "Right on target"}
          theme={tenYrDelta > 0.5 ? "danger" : "gold"}
        />
        <div style={{ ...S.stat, background: "#1A1208", border: "2px solid #C9A84C", cursor: "pointer" }}
          onClick={toggleStrategy}>
          <div style={{ ...S.statLbl, color: "#9A8060" }}>Investment Strategy</div>
          <div style={{ ...S.statVal, color: "#C9A84C", fontSize: 18, lineHeight: 1.3 }}>{stratLabel}</div>
          <div style={{ ...S.statSub, color: "#7A6040" }}>Tap to toggle · adjust on Cash & Investments tab</div>
        </div>
        <Stat
          label="Lifetime Income"
          value={fmt(totalIncome)}
       sub={"During runway · SS + Fidelity draws · " + runwayLabel}
          theme="gold"
        />
        <Stat
          label="Lifetime Expenses"
          value={fmt(totalExpenses)}
sub={"During runway · longer strategy = higher total · " + runwayLabel}
          theme="danger"
        />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, theme }) {
  theme = theme || "default";
  const bg = theme === "gold" ? "#1A1208" : theme === "danger" ? "#FFF0F0" : "#FFF9EF";
  const val = theme === "gold" ? "#C9A84C" : theme === "danger" ? "#C0392B" : "#1A1208";
  const bdr = theme === "gold" ? "2px solid #C9A84C" : theme === "danger" ? "2px solid #C0392B" : "1px solid #F0DEB4";
  return (
    <div style={{ ...S.stat, background: bg, border: bdr }}>
      <div style={{ ...S.statLbl, color: "#9A8060" }}>{label}</div>
      <div style={{ ...S.statVal, color: val }}>{value}</div>
      {sub && <div style={{ ...S.statSub, color: "#9A8060" }}>{sub}</div>}
    </div>
  );
}

function Budget({ dmv, setDmv, income, setIncome, fidelityWithdrawal, resetAll }) {
  const dmvTotal = sumObj(dmv);
  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>Budget</h2>
      <Card title="Income">
        <BRow label="Social Security" val={income.socialSecurity} onChange={v => setIncome(p => ({ ...p, socialSecurity: v }))} />
        <div style={S.brow}>
          <span style={S.browLbl}>Fidelity Withdrawal <span style={{ color: "#9A8060", fontSize: 12, fontStyle: "italic" }}>(auto)</span></span>
          <span style={{ ...S.goldNum, fontSize: 19 }}>{fmt(fidelityWithdrawal)}</span>
        </div>
        <TotalRow label="Monthly Total" main={income.socialSecurity + fidelityWithdrawal} />
      </Card>
      <Card title="Expenses — DMV">
        {Object.keys(DMV_LABELS).map(k => (
          <BRow key={k} label={DMV_LABELS[k]} val={dmv[k]} onChange={v => setDmv(p => ({ ...p, [k]: v }))} />
        ))}
        <TotalRow label="Monthly" main={dmvTotal} />
        <TotalRow label="Annual" main={dmvTotal * 12} />
      </Card>
      <button style={S.resetBtn} onClick={resetAll}>Reset All to Defaults</button>
    </div>
  );
}

function BRow({ label, val, onChange }) {
  return (
    <div style={S.brow}>
      <span style={S.browLbl}>{label}</span>
      <NumInput val={val} onChange={onChange} />
    </div>
  );
}

function TotalRow({ label, main }) {
  return (
    <div style={{ ...S.brow, borderBottom: "none", paddingTop: 14, fontWeight: 700 }}>
      <span>{label}</span>
      <span style={S.goldNum}>{fmt(main)}</span>
    </div>
  );
}

function HouseDeal({ house, setHouse, houseNet }) {
  const up = (k, v) => setHouse(p => ({ ...p, [k]: v }));
  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>House Deal</h2>
      <Card title="Starting Assets">
        <HRow label="Fidelity Balance" field="fidelityBalance" house={house} up={up} />
        <div style={S.brow}>
          <span style={S.browLbl}>As of Date</span>
          <input type="text" style={{ ...S.numInput, paddingLeft: 10, width: 160, textAlign: "left" }}
            value={house.fidelityDate} onChange={e => up("fidelityDate", e.target.value)} />
        </div>
      </Card>
      <Card title="Mississippi Sale">
        <HRow label="Sale Price" field="salePrice" house={house} up={up} />
        <HRow label="Mortgage Payoff" field="mortgagePayoff" house={house} up={up} />
        <HRow label="Transaction Costs" field="transactionCosts" house={house} up={up} />
        <HRow label="Repairs / Staging" field="repairs" house={house} up={up} />
        <HRow label="Moving / Furniture" field="moving" house={house} up={up} />
      </Card>
      <Card title="DMV Purchase">
        <div style={S.brow}>
          <span style={S.browLbl}>Scenario</span>
          <button style={{ ...S.pill, ...(house.rentInstead ? S.pillOn : {}) }} onClick={() => up("rentInstead", !house.rentInstead)}>
            {house.rentInstead ? "Renting" : "Buying"}
          </button>
        </div>
        {!house.rentInstead && <>
          <HRow label="Condo Price" field="condoPrice" house={house} up={up} />
          <HRow label="Down Payment" field="downPayment" house={house} up={up} />
        </>}
        <HRow label="Capital Gains Rate" field="capGainsRate" house={house} up={up} pct />
      </Card>
      <Card title="One-Time Gifts">
        <HRow label="Josh Gift" field="joshGift" house={house} up={up} />
      </Card>
      <div style={{ ...S.card, background: "#1A1208", textAlign: "center", padding: 32 }}>
        <div style={{ color: "#9A8060", fontSize: 12, textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>Net to Nest Egg</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, color: houseNet < 0 ? "#FF6868" : "#C9A84C" }}>{fmt(houseNet)}</div>
        <div style={{ color: "#7A6040", fontSize: 13, fontStyle: "italic", marginTop: 8 }}>{house.rentInstead ? "Rent scenario — full proceeds kept" : "Buy scenario — down payment deducted"}</div>
      </div>
    </div>
  );
}

function HRow({ label, field, house, up, pct }) {
  return (
    <div style={S.brow}>
      <span style={S.browLbl}>{label}</span>
      <NumInput val={house[field]} onChange={v => up(field, v)} pct={pct} />
    </div>
  );
}

function Projection({ nestEgg, monthlyDraw, proj, setProj }) {
  const up = (k, v) => setProj(p => ({ ...p, [k]: v }));
  const mmLine = buildProjectionLine(nestEgg, monthlyDraw, 2.5, proj.inflationPct);
  const fishLine = buildProjectionLine(nestEgg, monthlyDraw, 5.0, proj.inflationPct);
  const curLine = buildProjectionLine(nestEgg, monthlyDraw, proj.returnPct, proj.inflationPct);
  const chartData = mmLine.map((d, i) => ({
    label: i === 0 ? "Now" : i + "yr", age: d.age,
    "Money Market": mmLine[i].balance,
    "Fidelity Portfolio": fishLine[i].balance,
    ...(proj.manualReturn ? { "Custom": curLine[i].balance } : {}),
  }));
  const firstNeg = chartData.find(d => d["Money Market"] < 0);
  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>Cash & Investments</h2>
      <Card title="Investment Strategy">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {[["moneyMarket", "Money Market  2.5%"], ["fisher", "Fidelity Portfolio  5%"]].map(([id, lbl]) => (
            <button key={id} style={{ ...S.stratBtn, ...(proj.strategy === id && !proj.manualReturn ? S.stratBtnOn : {}) }}
              onClick={() => setProj(p => ({ ...p, strategy: id, returnPct: id === "moneyMarket" ? 2.5 : 5, manualReturn: false }))}>{lbl}</button>
          ))}
        </div>
        <p style={{ color: "#9A8060", fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
          <strong style={{ color: "#1A1208" }}>Money Market:</strong> Cash sitting safe — preserves principal but likely loses ground to inflation over time.
        </p>
        <p style={{ color: "#9A8060", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
          <strong style={{ color: "#1A1208" }}>Fidelity Portfolio:</strong> 50% bonds (IEF) / 40% S&P 500 (VOO) / 10% International (VEA) — more growth, more short-term volatility.
        </p>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <SliderField label="Return %" value={proj.returnPct} min={0} max={12} step={0.5}
            onChange={v => setProj(p => ({ ...p, returnPct: v, manualReturn: true, strategy: "" }))} />
          <SliderField label="Inflation %" value={proj.inflationPct} min={0} max={10} step={0.5}
            onChange={v => up("inflationPct", v)} />
        </div>
      </Card>
      <Card>
        {firstNeg && <div style={S.warn}>{"⚠️ Plan needs adjustment by year " + firstNeg.label + " (age " + firstNeg.age + ")"}</div>}
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B0" />
            <XAxis dataKey="label" tick={{ fontFamily: "Cormorant Garamond, serif", fontSize: 12 }} />
            <YAxis tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} tick={{ fontFamily: "Cormorant Garamond, serif", fontSize: 12 }} width={56} />
            <Tooltip formatter={(v, name) => [fmt(v), name]} contentStyle={{ fontFamily: "Cormorant Garamond, serif", background: "#FAF0DC", border: "1px solid #C9A84C", borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontFamily: "Cormorant Garamond, serif", fontSize: 14 }} />
            <Line type="monotone" dataKey="Money Market" stroke="#C9A84C" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Fidelity Portfolio" stroke="#8B4513" strokeWidth={2.5} strokeDasharray="6 3" dot={false} />
            {proj.manualReturn && <Line type="monotone" dataKey="Custom" stroke="#4A90D9" strokeWidth={2} strokeDasharray="3 3" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Year by Year">
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead><tr>{["Year", "Age", "Money Market", "Fidelity Portfolio"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {chartData.map((d, i) => {
                const mmNeg = d["Money Market"] < 0, fNeg = d["Fidelity Portfolio"] < 0;
                return (
                  <tr key={i} style={mmNeg ? { background: "#FFF0F0" } : i % 2 === 0 ? { background: "#FEFAF2" } : {}}>
                    <td style={S.td}>{d.label}</td>
                    <td style={S.td}>{d.age}</td>
                    <td style={{ ...S.td, color: mmNeg ? "#C0392B" : "#1A1208", fontWeight: mmNeg ? 700 : 500 }}>{fmt(d["Money Market"])}</td>
                    <td style={{ ...S.td, color: fNeg ? "#C0392B" : "#1A1208", fontWeight: fNeg ? 700 : 500 }}>{fmt(d["Fidelity Portfolio"])}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, cursor: "pointer" }}>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#9A8060" }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} style={{ accentColor: "#C9A84C", width: 180 }} onChange={e => onChange(Number(e.target.value))} />
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#C9A84C" }}>{value}%</span>
    </label>
  );
}

function Card({ title, children }) {
  return (
    <div style={S.card}>
      {title && <h3 style={S.cardTitle}>{title}</h3>}
      {children}
    </div>
  );
}

const S = {
  root: { minHeight: "100vh", background: "#FAF0DC", fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#1A1208" },
  wrap: { maxWidth: 900, margin: "0 auto", paddingBottom: 60 },
  nav: { background: "#1A1208", borderBottom: "2px solid #C9A84C", padding: "8px 16px 0", position: "sticky", top: 0, zIndex: 100 },
  brand: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#C9A84C", fontStyle: "italic", fontWeight: 700, letterSpacing: 2, marginBottom: 6, display: "block" },
  tabs: { display: "flex", overflowX: "auto", gap: 2, paddingBottom: 6, msOverflowStyle: "none", scrollbarWidth: "none" },
  tab: { background: "transparent", border: "none", color: "#C8B89A", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, padding: "6px 12px", borderRadius: 4, cursor: "pointer", letterSpacing: 0.5, flexShrink: 0 },
  tabActive: { background: "#C9A84C", color: "#1A1208", fontWeight: 700 },
  heroWrap: { position: "relative", height: 460, overflow: "hidden" },
  heroBg: { position: "absolute", inset: 0, backgroundSize: "contain", backgroundPosition: "center center", backgroundRepeat: "no-repeat" },
  heroShade: { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,18,8,.05) 0%, rgba(26,18,8,.6) 55%, rgba(26,18,8,.96) 100%)" },
  heroText: { position: "absolute", bottom: 28, left: 0, right: 0, textAlign: "center" },
  heroRunway: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 80, fontWeight: 700, color: "#C9A84C", lineHeight: 1, textShadow: "0 2px 24px rgba(0,0,0,.6)" },
  heroSub: { color: "#F5DEB3", fontSize: 14, letterSpacing: 5, textTransform: "uppercase", marginTop: 6, fontStyle: "italic" },
  heroRunout: { fontSize: 15, marginTop: 10, letterSpacing: 1 },
  cityBtn: { background: "rgba(26,18,8,0.65)", border: "1px solid rgba(201,168,76,0.6)", color: "#F5DEB3", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, padding: "6px 14px", borderRadius: 20, cursor: "pointer", letterSpacing: 0.5, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, padding: "20px 20px 0" },
  stat: { borderRadius: 8, padding: 18, textAlign: "center" },
  statLbl: { fontSize: 10, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 },
  statVal: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, lineHeight: 1.1 },
  statSub: { fontSize: 11, fontStyle: "italic", marginTop: 4 },
  badge: { position: "absolute", top: 8, right: 8, background: "#C9A84C", color: "#1A1208", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, letterSpacing: 0.5 },
  page: { padding: "28px 20px" },
  pageTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 700, marginBottom: 22, borderBottom: "2px solid #C9A84C", paddingBottom: 10 },
  card: { background: "#FFF9EF", border: "1px solid #F0DEB4", borderRadius: 8, padding: 22, marginBottom: 18 },
  cardTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontStyle: "italic", marginBottom: 16 },
  brow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #F0DEB4" },
  browLbl: { fontSize: 15, flex: 1 },
  dollar: { position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9A8060", fontSize: 17, pointerEvents: "none" },
  numInput: { width: 130, padding: "7px 8px 7px 22px", border: "1px solid #F0DEB4", borderRadius: 4, background: "#FAF0DC", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, color: "#1A1208", textAlign: "right" },
  goldNum: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#C9A84C" },
  resetBtn: { background: "transparent", border: "1px solid #9A8060", color: "#9A8060", padding: "8px 20px", borderRadius: 4, cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, letterSpacing: 1 },
  pill: { background: "transparent", border: "1px solid #F0DEB4", color: "#9A8060", padding: "6px 18px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14 },
  pillOn: { background: "#C9A84C", color: "#1A1208", border: "1px solid #C9A84C", fontWeight: 700 },
  stratBtn: { background: "transparent", border: "1px solid #F0DEB4", color: "#9A8060", padding: "8px 22px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15 },
  stratBtnOn: { background: "#C9A84C", color: "#1A1208", border: "1px solid #C9A84C", fontWeight: 700 },
  warn: { background: "#FFF0F0", border: "1px solid #C0392B", color: "#C0392B", padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 15, fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 18 },
  th: { textAlign: "left", padding: "10px 14px", background: "#1A1208", color: "#C9A84C", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, letterSpacing: 1 },
  td: { padding: "10px 14px", borderBottom: "1px solid #F0DEB4", fontSize: 18 },
};

const CSS = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { background: #FAF0DC; } input:focus { outline: 2px solid #C9A84C; outline-offset: 1px; } button { transition: opacity .15s; } button:hover { opacity: .8; }";
