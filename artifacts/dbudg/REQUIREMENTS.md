# D-Budg — Requirements
## Current deployed state
- **URL:** dbudg.netlify.app
- **Repo:** github.com/globalgoldstein-ai/dbudg
- **File:** `artifacts/dbudg/src/App.jsx`
- **Last build:** Session 4 | Build 6 | 2026-04-20
- **Stack:** React + Vite, single file, localStorage only, no backend

## Screens
1. **Dashboard** — hero photo, LA/DC scenario buttons, runway counter, stat tiles
2. **Budget** — income + expense editor
3. **House Sale** — sale inputs, DMV purchase, gifts, net summary
4. **Cash & Investments** — MM vs Fidelity Portfolio chart, sliders, year-by-year table

## Dashboard tiles
| Tile | Value | Theme |
|---|---|---|
| Fidelity Account | `house.fidelityBalance` | default |
| House Proceeds — Rent Scenario | `houseNetRent` | default |
| Josh Gift | `house.joshGift` | red, inline editable on tap |
| Total Nest Egg After House Sale | `nestEgg` | gold |
| Investment Strategy | MM ↔ Fidelity toggle | gold/dark, tappable |
| Monthly Draw | `monthlyDraw` | red |
| To Last 10 Years | cut or headroom vs 10yr target | red if over, gold if under |
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
- `nestEgg` = `fidelityBalance + houseNetRent − joshGift` (always rent scenario)
- Drawdown: balance earns return monthly, draw deducted monthly, draw grows with inflation
- `To Last 10 Years`: binary search for `targetDraw` that exhausts nestEgg in exactly 120 months
- `Lifetime Income` = `socialSecurity × totalMonths + inflationAdjustedDraws`
- `Lifetime Expenses` = sum of inflation-adjusted `monthlyExpenses` over `totalMonths`
- `projYears` = `Math.min(Math.ceil(runway.years + 3), 30)` — dynamic chart length

## Seed defaults
```js
