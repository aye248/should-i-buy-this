# Should I Buy This? v2 🧠💰

A smart financial decision engine that evaluates purchase decisions based on your personal financial situation — not just "can I afford it today", but **should** I buy it given my savings, goals, and risk profile.

## Live Demo

Open `index.html` directly in your browser — **no server needed**.

---

## What's New in v2

| Feature | v1 | v2 |
|---|---|---|
| Savings integration | ❌ | ✅ Safety net calculation |
| Financial goals | ❌ | ✅ Opportunity cost modeling |
| Scenario simulation | ❌ | ✅ Buy now / Wait 1mo / Wait 2mo |
| Score dimensions | 4 | 6 |
| Explainable breakdown | Basic | Full weight + note per dimension |

---

## Scoring Formula

Six dimensions, each scored 0–100, combined with configurable weights:

| Dimension | Weight | How it's computed |
|---|---|---|
| Affordability | 25% | `price / disposable income` → interpolated curve |
| Financial risk | 20% | `expenses / income` → interpolated curve |
| Savings impact | 25% | Months of expense buffer remaining after purchase |
| Necessity | 15% | Direct map: 1→12, 2→35, 3→55, 4→78, 5→100 |
| Goal impact | 10% | Months your financial goal is delayed |
| Impulse risk | 5% | Planned→92, Impulse→28 |

**Key insight**: All curves use piecewise linear interpolation — no hard cutoffs, no buckets. A purchase at 49% of disposable income scores smoothly between the 30% and 50% breakpoints.

---

## Project Structure

```
should-i-buy-this/
├── index.html              ← Full app (open in browser, no server needed)
├── src/
│   └── engine/
│       ├── config.js       ← All weights, breakpoints, thresholds
│       ├── scorer.js       ← Core decision engine (Node.js)
│       └── examples.js     ← Example outputs for 2 user profiles
└── README.md
```

---

## Testing the Engine (Node.js)

```bash
node src/engine/examples.js
```

This runs 2 contrasting user profiles through the engine and prints full results to the terminal.

**User A** — Junior developer, tight budget, impulse purchase:
- Income $2,200 | Expenses $1,600 | Savings $800
- Wants: $600 gaming monitor (impulse, necessity 2/5)
- Result: **DON'T BUY** (score 26/100)

**User B** — Mid-level engineer, stable finances, planned purchase:
- Income $4,500 | Expenses $1,800 | Savings $12,000
- Wants: $900 work laptop (planned, necessity 5/5)
- Result: **BUY** (score 84/100)

---

## Tuning the Engine

All scoring logic is data-driven. Edit `src/engine/config.js` to adjust:

```js
// Change dimension weights (must sum to 1.0)
weights: {
  affordability: 0.25,  // ← increase to penalize expensive items more
  savingsImpact: 0.25,  // ← increase to prioritize safety net
  ...
}

// Adjust classification thresholds
thresholds: {
  safe:  68,  // ← lower to make the engine more permissive
  risky: 42,
}
```

---

## GitHub Setup

```bash
cd should-i-buy-this
git init
git add .
git commit -m "feat: Should I Buy This v2 — savings, goals, scenario simulation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/should-i-buy-this.git
git push -u origin main
```

Then enable **GitHub Pages** → Settings → Pages → Source: `main` → `/root` → Save.

Your app will be live at: `https://YOUR_USERNAME.github.io/should-i-buy-this`

---

## Tech Stack

- Pure HTML/CSS/JavaScript — zero dependencies, zero build step
- Node.js version of the engine in `src/engine/` for backend use

## License

MIT
