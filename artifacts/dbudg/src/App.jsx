// D-Budg | Session 1 | Build 2 | 2026-04-08 | Fixed drawdown model, larger table/input numbers

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_DMV = {
  rent: 2100, hoa: 500, insurance: 30, utilities: 200, uber: 200,
  medication: 200, housekeeper: 200, cable: 75, mobile: 50,
  cigarettes: 280, groceries: 800, personal: 400,
};

const SEED_MS = {
  rent: 632, hoa: 0, insurance: 300, utilities: 300, uber: 50,
  medication: 100, housekeeper: 200, cable: 238, mobile: 150,
  cigarettes: 280, groceries: 1300, personal: 1000,
};

const DMV_LABELS = {
  rent: "Rent", hoa: "HOA", insurance: "Home / Renters Insurance",
  utilities: "Utilities", uber: "Uber / Transit", medication: "Medication",
  housekeeper: "Housekeeper", cable: "Cable / Internet", mobile: "Mobile Phone",
  cigarettes: "Cigarettes", groceries: "Groceries", personal: "Skin Care, Hair & Clothing",
};

const SEED_HOUSE = {
  salePrice: 250000, mortgagePayoff: 55000, transactionCostPct: 8,
  repairs: 0, moving: 10000, condoPrice: 300000, downPayment: 100000,
  capGainsRate: 15, rentInstead: false,
};

const SEED_INCOME = { socialSecurity: 1900, fidelityWithdrawal: 3135 };

const SEED_PROJ = { strategy: "moneyMarket", returnPct: 2.5, inflationPct: 2.5, manualReturn: false };

const FIDELITY_BALANCE = 75883;
const STARTING_AGE = 78;
const PROJECTION_YEARS = 25;

// ─── localStorage ─────────────────────────────────────────────────────────────

const LS = {
  get: (key, fallback) => {
    try { const v = localStorage.getItem(`dbudg-${key}`); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => { try { localStorage.setItem(`dbudg-${key}`, JSON.stringify(val)); } catch {} },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? "-$" : "$") + abs.toLocaleString("en-US");
};

const sumObj = (obj) => Object.values(obj).reduce((a, b) => a + Number(b || 0), 0);

function calcHouseNet(h) {
  const grossProceeds = h.salePrice - h.mortgagePayoff
    - (h.salePrice * h.transactionCostPct / 100) - h.repairs - h.moving;
  const basisGain = Math.max(0, h.salePrice - h.mortgagePayoff);
  const capGainsTax = basisGain * (h.capGainsRate / 100);
  const afterTax = grossProceeds - capGainsTax;
  return h.rentInstead ? afterTax : afterTax - h.downPayment;
}

// ─── CORRECTED drawdown model ─────────────────────────────────────────────────
// monthlyDraw = expenses − SS = amount pulled from nest egg each month
// draw grows with inflation each month; balance earns investment return on remainder

function buildProjectionLine(nestEgg, monthlyDraw, returnPct, inflationPct) {
  const data = [];
  let balance = nestEgg;
  let draw = monthlyDraw;
  const monthlyReturn = returnPct / 100 / 12;
  const monthlyInflation = inflationPct / 100 / 12;
  for (let yr = 0; yr <= PROJECTION_YEARS; yr++) {
    data.push({ yr, age: STARTING_AGE + yr, balance: Math.round(balance) });
    if (yr === PROJECTION_YEARS) break;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyReturn) - draw;
      draw *= (1 + monthlyInflation);
    }
  }
  return data;
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [dmv,    setDmv]    = useState(() => LS.get("dmv",    SEED_DMV));
  const [income, setIncome] = useState(() => LS.get("income", SEED_INCOME));
  const [house,  setHouse]  = useState(() => LS.get("house",  SEED_HOUSE));
  const [proj,   setProj]   = useState(() => LS.get("proj",   SEED_PROJ));
  const [city,   setCity]   = useState(() => {
    const p = new URLSearchParams(window.location.search).get("city");
    return p || LS.get("city", "dc");
  });

  useEffect(() => LS.set("dmv",    dmv),    [dmv]);
  useEffect(() => LS.set("income", income), [income]);
  useEffect(() => LS.set("house",  house),  [house]);
  useEffect(() => LS.set("proj",   proj),   [proj]);
  useEffect(() => LS.set("city",   city),   [city]);

  const houseNet        = calcHouseNet(house);
  const nestEgg         = FIDELITY_BALANCE + houseNet;
  const monthlyIncome   = sumObj(income);
  const monthlyExpenses = sumObj(dmv);
  const monthlyNet      = monthlyIncome - monthlyExpenses;
  const monthlyDraw     = monthlyExpenses - income.socialSecurity;

  const runway = (() => {
    let bal = nestEgg;
    let draw = monthlyDraw;
    const mReturn = proj.returnPct / 100 / 12;
    const mInflation = proj.inflationPct / 100 / 12;
    let months = 0;
    while (bal > 0 && months < 1200) {
      bal = bal * (1 + mReturn) - draw;
      draw *= (1 + mInflation);
      months++;
    }
    if (months >= 1200) return { years: 99, months: 0, date: null };
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return { years: Math.floor(months / 12), months: months % 12, date: d };
  })();

  const resetAll = () => { setDmv(SEED_DMV); setIncome(SEED_INCOME); setHouse(SEED_HOUSE); setProj(SEED_PROJ); };

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <Nav screen={screen} setScreen={setScreen} />
      <div style={S.wrap}>
        {screen === "dashboard"  && <Dashboard city={city} setCity={setCity} nestEgg={nestEgg} monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} monthlyNet={monthlyNet} monthlyDraw={monthlyDraw} runway={runway} />}
        {screen === "budget"     && <Budget dmv={dmv} setDmv={setDmv} income={income} setIncome={setIncome} resetAll={resetAll} />}
        {screen === "house"      && <HouseDeal house={house} setHouse={setHouse} houseNet={houseNet} />}
        {screen === "projection" && <Projection nestEgg={nestEgg} monthlyDraw={monthlyDraw} proj={proj} setProj={setProj} />}
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ screen, setScreen }) {
  const tabs = [["dashboard","Dashboard"],["budget","Budget"],["house","House Deal"],["projection","Projection"]];
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ city, setCity, nestEgg, monthlyIncome, monthlyExpenses, monthlyNet, monthlyDraw, runway }) {
  const runoutSoon = runway.date && runway.years < 5;
  return (
    <div>
      <div style={S.heroWrap}>
        <div style={{
          ...S.heroBg,
          backgroundImage: `url(/${city === "la" ? "denise-la" : "denise-dc"}.jpg), linear-gradient(135deg,#8B6914 0%,#C9A84C 40%,#F5DEB3 70%,#C9A84C 100%)`,
        }} />
        <div style={S.heroShade} />
        <div style={S.heroText}>
          <div style={S.heroRunway}>
            {runway.years >= 99 ? "∞" : `${runway.years}y ${runway.months}m`}
          </div>
          <div style={S.heroSub}>Runway Remaining</div>
          {runway.date && (
            <div style={{ ...S.heroRunout, color: runoutSoon ? "#FF6868" : "#F5DEB3" }}>
              Money runs out: {runway.date.toLocaleString("default", { month: "long", year: "numeric" })}
            </div>
          )}
        </div>
        <button style={S.cityBtn} onClick={() => setCity(c => c === "dc" ? "la" : "dc")}>
          {city === "dc" ? "📍 DC" : "📍 LA"}
        </button>
      </div>

      <div style={S.statGrid}>
        <Stat label="Nest Egg"         value={fmt(nestEgg)}         sub="Fidelity + house proceeds"     theme="gold" />
        <Stat label="Monthly Income"   value={fmt(monthlyIncome)}   sub="SS + Fidelity withdrawal" />
        <Stat label="Monthly Expenses" value={fmt(monthlyExpenses)} />
        <Stat label="Monthly Draw"     value={fmt(monthlyDraw)}     sub="From nest egg (expenses − SS)" theme="danger" />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, theme = "default" }) {
  const bg  = theme === "gold" ? "#1A1208" : theme === "danger" ? "#FFF0F0" : "#FFF9EF";
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

// ─── Budget ───────────────────────────────────────────────────────────────────

function Budget({ dmv, setDmv, income, setIncome, resetAll }) {
  const dmvTotal = sumObj(dmv);
  const msTotal  = sumObj(SEED_MS);
  const incTotal = sumObj(income);
  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>Budget</h2>
      <Card title="Income">
        <BRow label="Social Security"     val={income.socialSecurity}     onChange={v => setIncome(p => ({ ...p, socialSecurity: v }))} />
        <BRow label="Fidelity Withdrawal" val={income.fidelityWithdrawal} onChange={v => setIncome(p => ({ ...p, fidelityWithdrawal: v }))} />
        <TotalRow label="Monthly Total" main={incTotal} />
      </Card>
      <Card title="Expenses — DMV New">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <span style={{ ...S.muted, fontSize: 13 }}>MS Old (ref)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
        {Object.keys(DMV_LABELS).map(k => (
          <BRow key={k} label={DMV_LABELS[k]} val={dmv[k]} compare={SEED_MS[k]}
            onChange={v => setDmv(p => ({ ...p, [k]: v }))} />
        ))}
        <TotalRow label="Monthly" main={dmvTotal} compare={msTotal} />
        <TotalRow label="Annual"  main={dmvTotal * 12} compare={msTotal * 12} />
      </Card>
      <button style={S.resetBtn} onClick={resetAll}>Reset All to Defaults</button>
    </div>
  );
}

function BRow({ label, val, onChange, compare }) {
  return (
    <div style={S.brow}>
      <span style={S.browLbl}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {compare != null && <span style={{ ...S.muted, fontSize: 16, minWidth: 80, textAlign: "right" }}>{fmt(compare)}</span>}
        <MoneyInput val={val} onChange={onChange} />
      </div>
    </div>
  );
}

function TotalRow({ label, main, compare }) {
  return (
    <div style={{ ...S.brow, borderBottom: "none", paddingTop: 14, fontWeight: 700 }}>
      <span>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {compare != null && <span style={{ ...S.muted, fontSize: 16, minWidth: 80, textAlign: "right" }}>{fmt(compare)}</span>}
        <span style={S.goldNum}>{fmt(main)}</span>
      </div>
    </div>
  );
}

function MoneyInput({ val, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={S.dollar}>$</span>
      <input
        type="number"
        style={S.numInput}
        value={val}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ─── House Deal ───────────────────────────────────────────────────────────────

function HouseDeal({ house, setHouse, houseNet }) {
  const up = (k, v) => setHouse(p => ({ ...p, [k]: v }));
  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>House Deal</h2>
      <Card title="Mississippi Sale">
        <HRow label="Sale Price"         field="salePrice"          house={house} up={up} />
        <HRow label="Mortgage Payoff"    field="mortgagePayoff"     house={house} up={up} />
        <HRow label="Transaction Costs"  field="transactionCostPct" house={house} up={up} pct />
        <HRow label="Repairs / Staging"  field="repairs"            house={house} up={up} />
        <HRow label="Moving / Furniture" field="moving"             house={house} up={up} />
      </Card>
      <Card title="DMV Purchase">
        <div style={S.brow}>
          <span style={S.browLbl}>Rent Instead of Buy</span>
          <button style={{ ...S.pill, ...(house.rentInstead ? S.pillOn : {}) }}
            onClick={() => up("rentInstead", !house.rentInstead)}>
            {house.rentInstead ? "Yes — Renting" : "No — Buying"}
          </button>
        </div>
        {!house.rentInstead && <>
          <HRow label="Condo Price"  field="condoPrice"  house={house} up={up} />
          <HRow label="Down Payment" field="downPayment" house={house} up={up} />
        </>}
        <HRow label="Capital Gains Rate" field="capGainsRate" house={house} up={up} pct />
      </Card>
      <div style={{ ...S.card, background: "#1A1208", textAlign: "center", padding: 32 }}>
        <div style={{ color: "#9A8060", fontSize: 12, textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>Net to Nest Egg</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, color: houseNet < 0 ? "#FF6868" : "#C9A84C" }}>
          {fmt(houseNet)}
        </div>
        <div style={{ color: "#7A6040", fontSize: 13, fontStyle: "italic", marginTop: 8 }}>
          {house.rentInstead ? "Rent scenario — full proceeds kept" : "Buy scenario — down payment deducted"}
        </div>
      </div>
    </div>
  );
}

function HRow({ label, field, house, up, pct = false }) {
  return (
    <div style={S.brow}>
      <span style={S.browLbl}>{label}</span>
      <div style={{ position: "relative" }}>
        {!pct && <span style={S.dollar}>$</span>}
        <input
          type="number"
          style={{ ...S.numInput, ...(pct ? { paddingLeft: 10, paddingRight: 28, width: 96 } : {}) }}
          value={house[field]}
          onChange={e => up(field, Number(e.target.value))}
        />
        {pct && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#9A8060", fontSize: 17, pointerEvents: "none" }}>%</span>}
      </div>
    </div>
  );
}

// ─── Projection ───────────────────────────────────────────────────────────────

function Projection({ nestEgg, monthlyDraw, proj, setProj }) {
  const up = (k, v) => setProj(p => ({ ...p, [k]: v }));

  const mmLine   = buildProjectionLine(nestEgg, monthlyDraw, 2.5,            proj.inflationPct);
  const fishLine = buildProjectionLine(nestEgg, monthlyDraw, 5.0,            proj.inflationPct);
  const curLine  = buildProjectionLine(nestEgg, monthlyDraw, proj.returnPct, proj.inflationPct);

  const chartData = mmLine.map((d, i) => ({
    label: i === 0 ? "Now" : `${i}yr`,
    age: d.age,
    "Money Market":     mmLine[i].balance,
    "Fisher Portfolio": fishLine[i].balance,
    ...(proj.manualReturn ? { "Custom": curLine[i].balance } : {}),
  }));

  const firstNeg = chartData.find(d => d["Money Market"] < 0);

  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>Projection</h2>

      <Card title="Investment Strategy">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {[["moneyMarket","Money Market  2.5%"],["fisher","Fisher Portfolio  5%"]].map(([id, lbl]) => (
            <button key={id}
              style={{ ...S.stratBtn, ...(proj.strategy === id && !proj.manualReturn ? S.stratBtnOn : {}) }}
              onClick={() => setProj(p => ({ ...p, strategy: id, returnPct: id === "moneyMarket" ? 2.5 : 5, manualReturn: false }))}>
              {lbl}
            </button>
          ))}
        </div>
        <p style={{ ...S.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
          <strong style={{ color: "#1A1208" }}>Money Market:</strong> Cash sitting safe — preserves principal but likely loses ground to inflation over time.
        </p>
        <p style={{ ...S.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
          <strong style={{ color: "#1A1208" }}>Fisher Portfolio:</strong> 50% bonds (IEF) / 40% S&P 500 (VOO) / 10% International (VEA) — more growth, more short-term volatility.
        </p>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <SliderField label="Return %" value={proj.returnPct} min={0} max={12} step={0.5}
            onChange={v => setProj(p => ({ ...p, returnPct: v, manualReturn: true, strategy: "" }))} />
          <SliderField label="Inflation %" value={proj.inflationPct} min={0} max={10} step={0.5}
            onChange={v => up("inflationPct", v)} />
        </div>
      </Card>

      <Card>
        {firstNeg && (
          <div style={S.warn}>⚠️ Plan needs adjustment by year {firstNeg.label} (age {firstNeg.age})</div>
        )}
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B0" />
            <XAxis dataKey="label" tick={{ fontFamily: "Cormorant Garamond, serif", fontSize: 12 }} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontFamily: "Cormorant Garamond, serif", fontSize: 12 }} width={56} />
            <Tooltip formatter={(v, name) => [fmt(v), name]}
              contentStyle={{ fontFamily: "Cormorant Garamond, serif", background: "#FAF0DC", border: "1px solid #C9A84C", borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontFamily: "Cormorant Garamond, serif", fontSize: 14 }} />
            <Line type="monotone" dataKey="Money Market"     stroke="#C9A84C" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Fisher Portfolio" stroke="#8B4513" strokeWidth={2.5} strokeDasharray="6 3" dot={false} />
            {proj.manualReturn && <Line type="monotone" dataKey="Custom" stroke="#4A90D9" strokeWidth={2} strokeDasharray="3 3" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Year by Year">
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Year","Age","Money Market","Fisher Portfolio"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => {
                const mmNeg = d["Money Market"] < 0;
                const fNeg  = d["Fisher Portfolio"] < 0;
                return (
                  <tr key={i} style={mmNeg ? { background: "#FFF0F0" } : i % 2 === 0 ? { background: "#FEFAF2" } : {}}>
                    <td style={S.td}>{d.label}</td>
                    <td style={S.td}>{d.age}</td>
                    <td style={{ ...S.td, color: mmNeg ? "#C0392B" : "#1A1208", fontWeight: mmNeg ? 700 : 500 }}>{fmt(d["Money Market"])}</td>
                    <td style={{ ...S.td, color: fNeg  ? "#C0392B" : "#1A1208", fontWeight: fNeg  ? 700 : 500 }}>{fmt(d["Fisher Portfolio"])}</td>
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
      <input type="range" min={min} max={max} step={step} value={value}
        style={{ accentColor: "#C9A84C", width: 180 }}
        onChange={e => onChange(Number(e.target.value))} />
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#C9A84C" }}>{value}%</span>
    </label>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div style={S.card}>
      {title && <h3 style={S.cardTitle}>{title}</h3>}
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: { minHeight: "100vh", background: "#FAF0DC", fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#1A1208" },
  wrap: { maxWidth: 900, margin: "0 auto", paddingBottom: 60 },

  nav: {
    background: "#1A1208", borderBottom: "2px solid #C9A84C",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px", height: 56, flexWrap: "wrap", gap: 8,
    position: "sticky", top: 0, zIndex: 100,
  },
  brand: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#C9A84C", fontStyle: "italic", fontWeight: 700, letterSpacing: 2 },
  tabs:  { display: "flex", gap: 2, flexWrap: "wrap" },
  tab: {
    background: "transparent", border: "none", color: "#C8B89A",
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15,
    padding: "6px 14px", borderRadius: 4, cursor: "pointer", letterSpacing: 0.5,
  },
  tabActive: { background: "#C9A84C", color: "#1A1208", fontWeight: 700 },

  heroWrap: { position: "relative", height: 460, overflow: "hidden" },
  heroBg: { position: "absolute", inset: 0, backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat" },
  heroShade: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to bottom, rgba(26,18,8,.05) 0%, rgba(26,18,8,.6) 55%, rgba(26,18,8,.96) 100%)",
  },
  heroText:   { position: "absolute", bottom: 28, left: 0, right: 0, textAlign: "center" },
  heroRunway: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 80, fontWeight: 700, color: "#C9A84C", lineHeight: 1, textShadow: "0 2px 24px rgba(0,0,0,.6)" },
  heroSub:    { color: "#F5DEB3", fontSize: 14, letterSpacing: 5, textTransform: "uppercase", marginTop: 6, fontStyle: "italic" },
  heroRunout: { fontSize: 15, marginTop: 10, letterSpacing: 1 },
  cityBtn: {
    position: "absolute", top: 14, right: 14,
    background: "rgba(26,18,8,.65)", border: "1px solid #C9A84C",
    color: "#C9A84C", padding: "5px 14px", borderRadius: 20,
    cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, letterSpacing: 1,
  },

  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, padding: "20px 20px 0" },
  stat:     { borderRadius: 8, padding: 18, textAlign: "center" },
  statLbl:  { fontSize: 10, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 },
  statVal:  { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, lineHeight: 1.1 },
  statSub:  { fontSize: 11, fontStyle: "italic", marginTop: 4 },

  page:      { padding: "28px 20px" },
  pageTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 700, marginBottom: 22, borderBottom: "2px solid #C9A84C", paddingBottom: 10 },
  card:      { background: "#FFF9EF", border: "1px solid #F0DEB4", borderRadius: 8, padding: 22, marginBottom: 18 },
  cardTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontStyle: "italic", marginBottom: 16 },

  brow:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #F0DEB4" },
  browLbl: { fontSize: 15, flex: 1 },

  // inputs: 30% larger (15px → 19px, width 104 → 130)
  dollar:   { position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9A8060", fontSize: 17, pointerEvents: "none" },
  numInput: { width: 130, padding: "7px 8px 7px 22px", border: "1px solid #F0DEB4", borderRadius: 4, background: "#FAF0DC", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, color: "#1A1208", textAlign: "right" },
  goldNum:  { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#C9A84C" },
  muted:    { color: "#9A8060" },

  resetBtn: { background: "transparent", border: "1px solid #9A8060", color: "#9A8060", padding: "8px 20px", borderRadius: 4, cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, letterSpacing: 1 },
  pill:     { background: "transparent", border: "1px solid #F0DEB4", color: "#9A8060", padding: "6px 18px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14 },
  pillOn:   { background: "#C9A84C", color: "#1A1208", border: "1px solid #C9A84C", fontWeight: 700 },

  stratBtn:  { background: "transparent", border: "1px solid #F0DEB4", color: "#9A8060", padding: "8px 22px", borderRadius: 20, cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15 },
  stratBtnOn: { background: "#C9A84C", color: "#1A1208", border: "1px solid #C9A84C", fontWeight: 700 },
  warn:      { background: "#FFF0F0", border: "1px solid #C0392B", color: "#C0392B", padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 15, fontWeight: 600 },

  // table: 30% larger (14px → 18px)
  table: { width: "100%", borderCollapse: "collapse", fontSize: 18 },
  th:    { textAlign: "left", padding: "10px 14px", background: "#1A1208", color: "#C9A84C", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, letterSpacing: 1 },
  td:    { padding: "10px 14px", borderBottom: "1px solid #F0DEB4", fontSize: 18 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FAF0DC; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
  input:focus { outline: 2px solid #C9A84C; outline-offset: 1px; }
  button { transition: opacity .15s; }
  button:hover { opacity: .8; }
`;