/**
 * EXAMPLE OUTPUTS
 * Run: node src/engine/examples.js
 * Demonstrates the engine with 2 contrasting user profiles.
 */

const { computeDecision } = require('./scorer');

// ─────────────────────────────────────────────
//  USER A: Junior developer, tight budget
//  Considering: $600 gaming monitor (impulse)
// ─────────────────────────────────────────────
const userA = {
  income:   2200,
  expenses: 1600,
  price:    600,
  savings:  800,
  necessity: 2,
  impulse:  'impulse',
  goal: {
    name:               'Emergency fund',
    target:             5000,
    monthlyContribution: 150,
  },
};

// ─────────────────────────────────────────────
//  USER B: Mid-level engineer, stable finances
//  Considering: $900 laptop for freelance work (planned)
// ─────────────────────────────────────────────
const userB = {
  income:   4500,
  expenses: 1800,
  price:    900,
  savings:  12000,
  necessity: 5,
  impulse:  'planned',
  goal: {
    name:               'New car fund',
    target:             15000,
    monthlyContribution: 500,
  },
};

function printResult(label, inputs, result) {
  console.log('\n' + '═'.repeat(60));
  console.log(` ${label}`);
  console.log('═'.repeat(60));
  console.log(`  Item price:   $${inputs.price}`);
  console.log(`  Income:       $${inputs.income}/mo`);
  console.log(`  Expenses:     $${inputs.expenses}/mo`);
  console.log(`  Disposable:   $${result.disposable}/mo`);
  console.log(`  Savings:      $${inputs.savings}`);
  console.log(`  Necessity:    ${inputs.necessity}/5`);
  console.log(`  Impulse:      ${inputs.impulse}`);
  console.log(`  Goal:         ${inputs.goal.name} ($${inputs.goal.target})`);
  console.log('');
  console.log(`  VERDICT:  ${result.verdict.toUpperCase().padEnd(12)} SCORE: ${result.score}/100`);
  console.log('');
  console.log('  Score breakdown:');
  for (const [key, d] of Object.entries(result.dimensions)) {
    const bar = '█'.repeat(Math.round(d.score / 10)) + '░'.repeat(10 - Math.round(d.score / 10));
    console.log(`    ${d.label.padEnd(18)} ${bar} ${String(d.score).padStart(3)}/100  (weight ${(d.weight * 100).toFixed(0)}%, contributes ${d.contribution}pts)`);
  }
  console.log('');
  console.log('  Explanation:');
  console.log('  ' + result.explanation);
  console.log('');
  console.log('  Scenarios:');
  for (const [key, s] of Object.entries(result.scenarios)) {
    console.log(`    ${s.label.padEnd(16)} → savings after purchase: $${s.savingsAfterPurchase.toLocaleString().padStart(8)} | buffer: ${s.monthsBuffer}mo | goal: ${s.goalProgressPct != null ? s.goalProgressPct + '%' : 'N/A'}`);
  }
  console.log('');
  console.log('  Suggestion:');
  console.log('  ' + result.suggestion);
}

try {
  const resultA = computeDecision(userA);
  const resultB = computeDecision(userB);
  printResult('USER A — Junior dev, tight budget ($600 gaming monitor, impulse)', userA, resultA);
  printResult('USER B — Mid engineer, stable finances ($900 work laptop, planned)', userB, resultB);
  console.log('\n' + '═'.repeat(60) + '\n');
} catch (err) {
  console.error('Engine error:', err.message);
}
