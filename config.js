/**
 * SCORING CONFIG
 * All weights, breakpoints, and thresholds live here.
 * Tune any value without touching logic.
 */
const CONFIG = {

  // Dimension weights — must sum to 1.0
  weights: {
    affordability: 0.25,
    financialRisk: 0.20,
    savingsImpact: 0.25,
    necessity:     0.15,
    goalImpact:    0.10,
    impulse:       0.05,
  },

  // Classification thresholds
  thresholds: {
    safe:  68,  // score >= 68 → Buy
    risky: 42,  // score >= 42 → Risky, else → Don't Buy
  },

  // Affordability: price / disposable income
  // Low ratio = item is cheap relative to free cash → high score
  affordabilityBreakpoints: [
    { threshold: 0.05, score: 97 },
    { threshold: 0.15, score: 88 },
    { threshold: 0.30, score: 72 },
    { threshold: 0.50, score: 55 },
    { threshold: 0.75, score: 35 },
    { threshold: 1.00, score: 18 },
    { threshold: 2.00, score: 5  },
  ],

  // Financial risk: fixed expenses / income
  // High ratio = baseline is already tight
  financialRiskBreakpoints: [
    { threshold: 0.30, score: 95 },
    { threshold: 0.50, score: 82 },
    { threshold: 0.65, score: 65 },
    { threshold: 0.80, score: 42 },
    { threshold: 0.90, score: 22 },
    { threshold: 1.00, score: 5  },
  ],

  // Savings impact: months of expenses remaining AFTER purchase
  // Standard benchmark: 3 months = healthy emergency fund
  savingsImpactBreakpoints: [
    { threshold: 0.0,  score: 2  },  // savings wiped out
    { threshold: 0.5,  score: 18 },  // under 2 weeks buffer
    { threshold: 1.0,  score: 38 },  // 1 month buffer
    { threshold: 2.0,  score: 60 },  // 2 months
    { threshold: 3.0,  score: 80 },  // healthy
    { threshold: 6.0,  score: 95 },  // very healthy
    { threshold: 12.0, score: 100 }, // excellent
  ],

  // Goal impact: months the financial goal is delayed by this purchase
  goalImpactBreakpoints: [
    { threshold: 0,   score: 100 },
    { threshold: 0.5, score: 85  },
    { threshold: 1,   score: 70  },
    { threshold: 2,   score: 50  },
    { threshold: 3,   score: 35  },
    { threshold: 6,   score: 18  },
    { threshold: 12,  score: 5   },
  ],

  // Direct maps
  necessityMap: { 1: 12, 2: 35, 3: 55, 4: 78, 5: 100 },
  impulseMap:   { planned: 92, impulse: 28 },
};

module.exports = { CONFIG };
