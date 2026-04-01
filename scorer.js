/**
 * DECISION ENGINE — Should I Buy This? v2
 *
 * Pure functions only. No side effects. No external dependencies.
 * Every score is explainable — each dimension returns its own value,
 * weight, and contribution to the final score.
 */

const { CONFIG } = require('./config');

// ─────────────────────────────────────────────
//  UTILITY: Piecewise linear interpolation
// ─────────────────────────────────────────────
function interpolate(value, breakpoints) {
  const pts = breakpoints;
  if (value <= pts[0].threshold) return pts[0].score;
  if (value >= pts[pts.length - 1].threshold) return pts[pts.length - 1].score;
  for (let i = 0; i < pts.length - 1; i++) {
    if (value >= pts[i].threshold && value <= pts[i + 1].threshold) {
      const t = (value - pts[i].threshold) / (pts[i + 1].threshold - pts[i].threshold);
      return pts[i].score + t * (pts[i + 1].score - pts[i].score);
    }
  }
  return 50;
}

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

// ─────────────────────────────────────────────
//  DIMENSION SCORERS
// ─────────────────────────────────────────────

function scoreAffordability(price, disposable) {
  if (disposable <= 0) return 0;
  const ratio = price / disposable;
  return clamp(interpolate(ratio, CONFIG.affordabilityBreakpoints));
}

function scoreFinancialRisk(expenses, income) {
  if (income <= 0) return 0;
  const ratio = expenses / income;
  return clamp(interpolate(ratio, CONFIG.financialRiskBreakpoints));
}

function scoreSavingsImpact(savings, price, expenses) {
  const savingsAfter = savings - price;
  // Express remaining savings as months of expense coverage
  const monthsBuffer = expenses > 0 ? savingsAfter / expenses : savingsAfter > 0 ? 12 : 0;
  return clamp(interpolate(Math.max(0, monthsBuffer), CONFIG.savingsImpactBreakpoints));
}

function scoreGoalImpact(price, goal) {
  // No goal defined → neutral score (doesn't penalize, doesn't reward)
  if (!goal || !goal.target || !goal.monthlyContribution) return 75;

  // How many months of contributions does this purchase cost?
  const delayMonths = goal.monthlyContribution > 0
    ? price / goal.monthlyContribution
    : price > 0 ? 12 : 0;

  return clamp(interpolate(delayMonths, CONFIG.goalImpactBreakpoints));
}

function scoreNecessity(necessity) {
  return CONFIG.necessityMap[necessity] || 50;
}

function scoreImpulse(impulse) {
  return CONFIG.impulseMap[impulse] || 50;
}

// ─────────────────────────────────────────────
//  SCENARIO SIMULATION
// ─────────────────────────────────────────────

function simulateScenario(label, monthsWait, { income, expenses, price, savings, goal }) {
  const disposable = income - expenses;
  const savingsAccumulated = monthsWait * disposable;
  const savingsAfterPurchase = savings + savingsAccumulated - price;
  const monthsBuffer = expenses > 0 ? savingsAfterPurchase / expenses : 0;

  // Goal progress
  let goalDelayMonths = null;
  let goalProgressPct = null;
  if (goal && goal.target && goal.monthlyContribution) {
    const currentGap = goal.target - savings;
    const monthsToGoalNow   = currentGap > 0 ? currentGap / goal.monthlyContribution : 0;
    const gapAfterWait      = goal.target - (savings + monthsWait * goal.monthlyContribution);
    const monthsToGoalAfter = gapAfterWait > 0 ? gapAfterWait / goal.monthlyContribution : 0;
    // After buying: remaining gap increases by price / contribution
    const purchaseCostInMonths = goal.monthlyContribution > 0 ? price / goal.monthlyContribution : 0;
    goalDelayMonths = Math.max(0, purchaseCostInMonths - monthsWait * 0);
    goalProgressPct = goal.target > 0
      ? Math.min(100, Math.round(((savings + monthsWait * goal.monthlyContribution) / goal.target) * 100))
      : null;
  }

  return {
    label,
    monthsWait,
    savingsBefore: Math.round(savings + savingsAccumulated),
    savingsAfterPurchase: Math.round(savingsAfterPurchase),
    monthsBuffer: Math.round(monthsBuffer * 10) / 10,
    monthlyDisposable: Math.round(disposable),
    goalProgressPct,
    canAfford: savingsAfterPurchase >= 0 && (disposable >= 0 || monthsWait > 0),
  };
}

function buildScenarios(inputs) {
  const { income, expenses, price, savings, goal } = inputs;
  const disposable = income - expenses;

  return {
    buyNow: simulateScenario('Buy now', 0, inputs),
    waitOneMonth: simulateScenario('Wait 1 month', 1, inputs),
    waitTwoMonths: simulateScenario('Wait 2 months', 2, inputs),
  };
}

// ─────────────────────────────────────────────
//  MAIN ENGINE
// ─────────────────────────────────────────────

function computeDecision(inputs) {
  const { income, expenses, price, savings = 0, necessity, impulse, goal } = inputs;

  if (!income || income <= 0) throw new Error('Income must be greater than 0');
  if (expenses < 0)           throw new Error('Expenses cannot be negative');
  if (price <= 0)             throw new Error('Price must be greater than 0');

  const disposable = income - expenses;

  // --- Score each dimension ---
  const dimensions = {
    affordability: {
      score:  Math.round(scoreAffordability(price, disposable)),
      weight: CONFIG.weights.affordability,
      label:  'Affordability',
      note:   `Item costs ${Math.round((price / Math.max(disposable, 1)) * 100)}% of your disposable income`,
    },
    financialRisk: {
      score:  Math.round(scoreFinancialRisk(expenses, income)),
      weight: CONFIG.weights.financialRisk,
      label:  'Financial risk',
      note:   `Fixed expenses are ${Math.round((expenses / income) * 100)}% of your income`,
    },
    savingsImpact: {
      score:  Math.round(scoreSavingsImpact(savings, price, expenses)),
      weight: CONFIG.weights.savingsImpact,
      label:  'Savings impact',
      note:   `After purchase: $${Math.round(savings - price).toLocaleString()} savings (${
        expenses > 0 ? (Math.max(0, (savings - price) / expenses)).toFixed(1) : '∞'
      } months buffer)`,
    },
    necessity: {
      score:  scoreNecessity(necessity),
      weight: CONFIG.weights.necessity,
      label:  'Necessity',
      note:   ['', 'Pure want', 'Nice to have', 'Balanced', 'Quite needed', 'Essential'][necessity] || '',
    },
    goalImpact: {
      score:  Math.round(scoreGoalImpact(price, goal)),
      weight: CONFIG.weights.goalImpact,
      label:  'Goal impact',
      note:   goal
        ? `"${goal.name}" — purchase delays goal by ~${
            goal.monthlyContribution > 0
              ? (price / goal.monthlyContribution).toFixed(1)
              : '?'
          } months of contributions`
        : 'No goal set',
    },
    impulse: {
      score:  scoreImpulse(impulse),
      weight: CONFIG.weights.impulse,
      label:  'Behavioral risk',
      note:   impulse === 'impulse' ? 'Impulse purchase — higher risk of regret' : 'Planned purchase — lower regret risk',
    },
  };

  // --- Weighted final score ---
  let finalScore = 0;
  for (const key of Object.keys(dimensions)) {
    const d = dimensions[key];
    d.contribution = Math.round(d.score * d.weight * 10) / 10;
    finalScore += d.score * d.weight;
  }
  finalScore = clamp(Math.round(finalScore));

  // --- Classify ---
  const verdict =
    finalScore >= CONFIG.thresholds.safe  ? 'buy'   :
    finalScore >= CONFIG.thresholds.risky ? 'risky' : 'no';

  // --- Scenarios ---
  const scenarios = buildScenarios(inputs);

  // --- Explanation ---
  const explanation = buildExplanation(verdict, dimensions, inputs, scenarios);

  // --- Suggestion ---
  const suggestion = buildSuggestion(verdict, dimensions, inputs, scenarios);

  return {
    score:       finalScore,
    verdict,
    disposable:  Math.round(disposable),
    dimensions,
    scenarios,
    explanation,
    suggestion,
  };
}

// ─────────────────────────────────────────────
//  LANGUAGE LAYER
// ─────────────────────────────────────────────

function buildExplanation(verdict, dims, inputs, scenarios) {
  const { income, expenses, price, savings, necessity, impulse, goal } = inputs;
  const disposable = income - expenses;
  const pct = Math.round((price / Math.max(disposable, 1)) * 100);
  const savingsAfter = savings - price;
  const necessityLabels = { 1: 'a pure want', 2: 'a nice-to-have', 3: 'moderately necessary', 4: 'quite necessary', 5: 'essential' };

  const weakest = Object.entries(dims).sort((a, b) => a[1].score - b[1].score)[0];

  if (verdict === 'buy') {
    return `Your finances support this purchase. The item costs ${pct}% of your monthly disposable income` +
      (savings > price * 2 ? `, your savings remain healthy at $${Math.round(savingsAfter).toLocaleString()} after buying` : '') +
      `, and it's ${necessityLabels[necessity] || 'reasonably necessary'}` +
      (impulse === 'planned' ? ', which you planned ahead.' : '. Even though it came to mind impulsively, the numbers work.') +
      (goal ? ` It slightly delays your "${goal.name}" goal but not critically.` : '');
  }

  if (verdict === 'risky') {
    return `This purchase sits in a grey zone. Your weakest factor is ${weakest[1].label.toLowerCase()} (score: ${weakest[1].score}/100). ` +
      `The item is ${pct}% of your disposable income` +
      (savingsAfter < expenses ? `, and after buying you'd have less than one month of expenses in savings ($${Math.round(savingsAfter).toLocaleString()})` : '') +
      (impulse === 'impulse' ? ', and this is impulse-driven which adds behavioral risk.' : '.') +
      (goal ? ` It would also delay your "${goal.name}" goal.` : '');
  }

  return `This purchase is not recommended right now. ` +
    (savingsAfter < 0 ? `It would put you $${Math.abs(Math.round(savingsAfter)).toLocaleString()} into your savings with no buffer.` :
     savingsAfter < expenses ? `You'd have under one month of expenses in savings after buying.` : '') +
    ` Your weakest factor is ${weakest[1].label.toLowerCase()} (score: ${weakest[1].score}/100).` +
    (goal ? ` This purchase would delay your "${goal.name}" goal significantly.` : '');
}

function buildSuggestion(verdict, dims, inputs, scenarios) {
  const { price, savings, goal, necessity, impulse } = inputs;
  const { waitOneMonth, waitTwoMonths } = scenarios;

  if (verdict === 'buy') {
    return impulse === 'impulse'
      ? 'The numbers work — but sleep on it 24 hours to confirm it\'s genuinely what you want. Then buy with confidence.'
      : 'Go ahead. You planned this, your finances support it, and the impact on your savings is manageable.';
  }

  if (verdict === 'risky') {
    if (waitOneMonth.savingsAfterPurchase > savings - price + inputs.income - inputs.expenses) {
      return `Wait 1 month. By then your savings would be $${waitOneMonth.savingsBefore.toLocaleString()} before the purchase — a much safer position.` +
        (goal ? ` You'd also be ${waitOneMonth.goalProgressPct}% toward your "${goal.name}" goal.` : '');
    }
    return necessity >= 4
      ? `If this is genuinely necessary, look for a lower price, a used version, or split the payment. Don't strain your safety net.`
      : `Wait 1–2 months, build a slightly larger buffer, then reassess. The wait costs you nothing and lowers the risk significantly.`;
  }

  // Don't buy
  if (waitTwoMonths.canAfford && waitTwoMonths.savingsAfterPurchase > 0) {
    return `Wait 2 months. By then you'd have $${waitTwoMonths.savingsBefore.toLocaleString()} saved before buying — leaving you $${waitTwoMonths.savingsAfterPurchase.toLocaleString()} after the purchase with a ${waitTwoMonths.monthsBuffer}-month buffer.` +
      (goal ? ` You'd also reach ${waitTwoMonths.goalProgressPct}% of your "${goal.name}" goal.` : '');
  }
  return goal
    ? `Focus on your "${goal.name}" goal first. Once you hit your target, you'll have the financial flexibility to make this purchase comfortably.`
    : `Build an emergency fund of at least 3 months of expenses first ($${Math.round(inputs.expenses * 3).toLocaleString()}), then revisit this purchase.`;
}

module.exports = { computeDecision, CONFIG };
