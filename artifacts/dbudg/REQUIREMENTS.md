# D-Budg — Requirements
## Current deployed state
- **URL:** dbudg.netlify.app
- **Repo:** github.com/globalgoldstein-ai/dbudg
- **File:** `artifacts/dbudg/src/App.jsx`
- **Last build:** Session 3 | Build 9 | 2026-04-18
- **Stack:** React + Vite, single file, localStorage only, no backend

## Screens
1. **Dashboard** — hero photo, LA/DC scenario buttons, runway counter, stat tiles
2. **Budget** — income + expense editor
3. **House Deal** — sale inputs, DMV purchase, gifts, net summary
4. **Cash & Investments** — MM vs Fidelity Portfolio chart, sliders, year-by-year table

## Dashboard tiles
| Tile | Value | Theme |
|---|---|---|
| Fidelity Account | `house.fidelityBalance` | default |
| House Proceeds — Rent Scenario | `houseNetRent` | clickable, selects rent scenario |
| House Proceeds — Buy Scenario | `houseNetBuy` | clickable, selects buy scenario |
| Josh Gift | `house.joshGift` | red, inline editable on tap |
| Total Nest Egg After House Sale | `nestEgg` | gold |
| Monthly Draw | `monthlyDraw` | red |
| To Last 10 Years | cut or headroom vs 10yr target | red if over, gold if under |
| Investment Strategy | MM ↔ Fidelity toggle | gold/dark, tappable |
| Lifetime Income | SS + Fidelity draws over runway | gold |
| Lifetime Expenses | inflation-adjusted total over runway | red |

## Hero image
- LA button (left) and DC button (right) overlaid on hero photo
- Tap shows "✨ Coming Soon" for 2 seconds
- File: `denise.jpg` in `artifacts/dbudg/public/`

## Key formulas
- `monthlyExpenses` = sum of all DMV fields
- `fidelityWithdrawal` = `max(0, monthlyExpenses − socialSecurity)` — never user-editable
- `monthlyDraw` = `fidelityWithdrawal`
- `houseNet` = `salePrice − mortgagePayoff − transactionCosts − repairs − moving − capGainsTax`
- `nestEgg` = `fidelityBalance + houseNet − joshGift`
- Drawdown: balance earns return monthly, draw deducted monthly, draw grows with inflation
- `To Last 10 Years`: binary search for `targetDraw` that exhausts nestEgg in exactly 120 months
- `Lifetime Income` = `socialSecurity × totalMonths + inflationAdjustedDraws`
- `Lifetime Expenses` = sum of inflation-adjusted `monthlyExpenses` over `totalMonths`

## Seed defaults
```js
SEED_DMV: { rent:2100, hoa:0, insurance:30, utilities:200, uber:200,
             medication:400, housekeeper:200, cable:75, mobile:50,
             cigarettes:280, groceries:800, personal:400 }

SEED_HOUSE: { salePrice:255000, mortgagePayoff:46812.67, transactionCosts:14311.47,
              repairs:0, moving:10000, condoPrice:300000, downPayment:100000,
              capGainsRate:0, rentInstead:true,
              fidelityBalance:75883, fidelityDate:"April 2026",
              joshGift:30000 }

SEED_INCOME: { socialSecurity:1900 }
SEED_PROJ: { strategy:"moneyMarket", returnPct:2.5, inflationPct:2.5, manualReturn:false }
```

## DMV labels (never change keys)
- `medication` → "Medical" ($400/mo)
- All others as defined in `DMV_LABELS`

## localStorage keys (never change)
- `dbudg-dmv`
- `dbudg-income`
- `dbudg-house`
- `dbudg-proj`

## useState init pattern (never change)
```js
useState(() => ({ ...SEED_HOUSE, ...LS.get("house", {}) }))
```

## Invariants
- `fidelityWithdrawal` is always auto-calculated, never user-editable
- localStorage key prefix is always `dbudg-`
- `dist/` must never be committed
- "Fisher" is gone — all references use "Fidelity Portfolio"
- Tab is "Cash & Investments" not "Projection"

## Number formatting
- All display values use `fmt()` → `$1,234` format
- All inputs use `NumInput` component — commas when unfocused, raw when focused

## Nav
- Sticky top, stacked layout (brand on top, tabs below)
- Tabs: Dashboard | Budget | House Deal | Cash & Investments
- `overflowX: auto` + `flexShrink: 0` for mobile scroll

## Deploy workflow
1. Paste `App.jsx` into **GitHub web UI** → `artifacts/dbudg/src/App.jsx`
2. Always paste through Notes/plain text first to strip zero-width characters
3. Netlify auto-deploys from `main` in ~1 min

## Build history
| Session | Build | Date | Description |
|---|---|---|---|
| 1 | 1-4 | pre-2026-04-18 | Initial scaffold, projection model, HOA fix |
| 2 | 5 | 2026-04-18 | Seed merge fix, photo contain, Fisher restored |
| 3 | 1 | 2026-04-18 | To Last 10 Years tile |
| 3 | 2 | 2026-04-18 | Dollar transaction costs, commas, mobile nav, tile label |
| 3 | 3 | 2026-04-18 | Josh gift tile, inline editable, reduces nest egg |
| 3 | 4 | 2026-04-18 | Medical label + default $400 |
| 3 | 5 | 2026-04-18 | Remove MS budget |
| 3 | 6 | 2026-04-18 | Rename Projection tab to Cash & Investments |
| 3 | 7 | 2026-04-18 | Strategy tile, LA/DC buttons, Fidelity rename, lifetime tiles |
| 3 | 8 | 2026-04-18 | Lifetime tile subtitles clarified |
| 3 | 9 | 2026-04-18 | Lifetime Income subtitle adds "During runway" |
