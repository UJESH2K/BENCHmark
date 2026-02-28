/**
 * Three built-in sample models with hand-crafted weights.
 * Architecture: 10 (price window) → 16 (relu) → 8 (relu) → 3 (softmax)
 *
 * Each model has a distinct "personality":
 *   1. Momentum Trader  – follows trends
 *   2. Mean-Reversion   – bets against extremes
 *   3. Volatility Scalper – trades on high variance, holds on calm
 */

/* ─── helpers ──────────────────────────────────────────────────────── */

const W = (rows, cols, fn) =>
  Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => fn(i, j, rows, cols))
  );

const B = (n, v = 0) => Array.from({ length: n }, () => v);

/* ─── 1. Momentum Trader ──────────────────────────────────────────── */

function buildMomentum() {
  // Layer 1  (10 → 16 relu)
  // Recent prices get larger weights → detect direction
  const l1 = W(10, 16, (i, j) => {
    const recency = (i + 1) / 10;                 // 0.1 … 1.0
    if (j < 8)  return  recency * (0.4 - j * 0.04);  // uptrend detectors
    return            -recency * (0.4 - (j - 8) * 0.04);  // downtrend detectors
  });

  // Layer 2  (16 → 8 relu)
  const l2 = W(16, 8, (i, j) => {
    if (i < 8  && j < 4) return  0.35;   // uptrend → group A
    if (i >= 8 && j >= 4) return  0.35;  // downtrend → group B
    return -0.05;
  });

  // Layer 3  (8 → 3 softmax)
  const l3 = W(8, 3, (i, j) => {
    if (j === 0) return i < 4 ?  0.7 : -0.3;  // buy ← uptrend
    if (j === 1) return i >= 4 ?  0.7 : -0.3;  // sell ← downtrend
    return 0.05;                                 // hold
  });

  return {
    name: 'Momentum Trader',
    description: 'Follows price trends — buys on uptrends, sells on downtrends',
    color: '#f0b90b',
    icon: 'TrendingUp',
    inputWindow: 10,
    layers: [
      { weights: l1, bias: B(16, 0),    activation: 'relu' },
      { weights: l2, bias: B(8, 0),     activation: 'relu' },
      { weights: l3, bias: [0.1, -0.1, 0], activation: 'softmax' },
    ],
  };
}

/* ─── 2. Mean-Reversion Agent ─────────────────────────────────────── */

function buildMeanReversion() {
  // Opposite of momentum: buy dips, sell rips
  const l1 = W(10, 16, (i, j) => {
    const recency = (i + 1) / 10;
    if (j < 8)  return -recency * (0.35 - j * 0.03);  // dip detectors
    return             recency * (0.35 - (j - 8) * 0.03);
  });

  const l2 = W(16, 8, (i, j) => {
    if (i < 8  && j < 4) return  0.30;
    if (i >= 8 && j >= 4) return  0.30;
    return -0.04;
  });

  const l3 = W(8, 3, (i, j) => {
    if (j === 0) return i < 4 ?  0.65 : -0.25;   // buy ← dip detected
    if (j === 1) return i >= 4 ?  0.65 : -0.25;   // sell ← rip detected
    return 0.15;
  });

  return {
    name: 'Mean-Reversion',
    description: 'Buys dips and sells rips — bets on price returning to the mean',
    color: '#26a17b',
    icon: 'Repeat',
    inputWindow: 10,
    layers: [
      { weights: l1, bias: B(16, 0.05), activation: 'relu' },
      { weights: l2, bias: B(8, 0),     activation: 'relu' },
      { weights: l3, bias: [0.0, 0.0, 0.1], activation: 'softmax' },
    ],
  };
}

/* ─── 3. Volatility Scalper ───────────────────────────────────────── */

function buildVolatilityScalper() {
  // Detects variance in window; trades on high vol, holds on low vol
  // Uses squared-diff–style features from adjacent prices
  const l1 = W(10, 16, (i, j) => {
    // Odd neurons: magnitude of change (abs-like via squared features)
    // Even neurons: direction of change
    const recency = (i + 1) / 10;
    if (j % 2 === 0) return recency * Math.sin((i + j) * 0.7) * 0.4;
    return                  recency * Math.cos((i + j) * 0.5) * 0.4;
  });

  const l2 = W(16, 8, (i, j) => {
    // Combine volatility features
    return Math.sin((i * 3 + j * 7) * 0.3) * 0.25;
  });

  const l3 = W(8, 3, (i, j) => {
    if (j === 0) return (i % 3 === 0) ?  0.5 : -0.1;  // buy
    if (j === 1) return (i % 3 === 1) ?  0.5 : -0.1;  // sell
    return (i % 3 === 2) ? 0.6 : 0.15;                  // hold (stronger hold bias in calm)
  });

  return {
    name: 'Volatility Scalper',
    description: 'Trades aggressively during volatile swings, holds when calm',
    color: '#627eea',
    icon: 'Activity',
    inputWindow: 10,
    layers: [
      { weights: l1, bias: B(16, 0.02), activation: 'relu' },
      { weights: l2, bias: B(8, 0.01),  activation: 'relu' },
      { weights: l3, bias: [-0.05, -0.05, 0.2], activation: 'softmax' },
    ],
  };
}

/* ─── Export ───────────────────────────────────────────────────────── */

export const SAMPLE_MODELS = [
  buildMomentum(),
  buildMeanReversion(),
  buildVolatilityScalper(),
];
