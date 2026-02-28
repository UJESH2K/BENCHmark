/**
 * Pure JavaScript Neural Network Inference Engine
 * No TensorFlow.js dependency — runs matrix math directly in the browser.
 *
 * Model JSON format:
 * {
 *   "name": "MyModel",
 *   "description": "...",
 *   "inputWindow": 5,
 *   "layers": [
 *     { "weights": [[...]], "bias": [...], "activation": "relu" },
 *     ...
 *     { "weights": [[...]], "bias": [...], "activation": "softmax" }  // last layer must output 3
 *   ]
 * }
 *
 * Output: [buy_prob, sell_prob, hold_prob]
 */

/* ─── Activation Functions ─────────────────────────────────────────── */

const activations = {
  relu:    (x) => x.map(v => Math.max(0, v)),
  sigmoid: (x) => x.map(v => 1 / (1 + Math.exp(-Math.min(Math.max(v, -500), 500)))),
  tanh:    (x) => x.map(v => Math.tanh(v)),
  softmax: (x) => {
    const max = Math.max(...x);
    const exps = x.map(v => Math.exp(v - max));
    const sum  = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
  },
  linear: (x) => x,
};

/* ─── Dense Layer  y = xW + b ──────────────────────────────────────── */

function dense(input, weights, bias) {
  const out = new Array(bias.length).fill(0);
  for (let j = 0; j < bias.length; j++) {
    let s = bias[j];
    for (let i = 0; i < input.length; i++) {
      s += input[i] * weights[i][j];
    }
    out[j] = s;
  }
  return out;
}

/* ─── Forward Pass ─────────────────────────────────────────────────── */

export function predict(model, input) {
  let x = [...input];
  for (const layer of model.layers) {
    x = dense(x, layer.weights, layer.bias);
    const act = activations[layer.activation || 'relu'];
    x = act(x);
  }
  return x; // [buy, sell, hold]
}

/* ─── Feature Engineering ──────────────────────────────────────────── */

/**
 * Build feature vector for inference.
 * Auto-detects the required input dimension from the model's first layer.
 * For each candle in the window we produce 5 features:
 *   0: normalised price  (p / base - 1)
 *   1: return            (p - prev) / prev
 *   2: SMA ratio         (p / sma - 1)
 *   3: volatility        (rolling stddev of returns)
 *   4: RSI-like          (up_moves / total_moves in sub-window)
 *
 * If the model only needs `windowSize` features (simple case), we
 * fall back to normalised prices.
 */
export function prepareFeatures(prices, windowSize = 5, model = null) {
  const inputDim = model?.layers?.[0]?.weights?.length ?? windowSize;

  // Ensure we have enough prices
  const needed = Math.max(windowSize, 20); // keep a buffer for rolling stats
  if (prices.length < needed) {
    const pad = new Array(needed - prices.length).fill(prices[0] || 1);
    prices = [...pad, ...prices];
  }

  const win = prices.slice(-windowSize);
  const base = win[0] || 1;

  // Simple path: model input dim === windowSize → normalised prices
  if (inputDim === windowSize) {
    return win.map(p => (p / base) - 1);
  }

  // Multi-feature path: 5 features per candle
  const featuresPerCandle = Math.floor(inputDim / windowSize) || 5;
  const extended = prices.slice(-(windowSize + 10)); // extra history for rolling calcs

  const features = [];
  for (let i = 0; i < windowSize; i++) {
    const idx = extended.length - windowSize + i;
    const p    = extended[idx];
    const prev = extended[idx - 1] || p;

    // f0: normalised price
    features.push((p / base) - 1);

    if (featuresPerCandle >= 2) {
      // f1: return
      features.push(prev !== 0 ? (p - prev) / prev : 0);
    }
    if (featuresPerCandle >= 3) {
      // f2: SMA ratio (5-period SMA)
      const smaSlice = extended.slice(Math.max(0, idx - 4), idx + 1);
      const sma = smaSlice.reduce((a, b) => a + b, 0) / smaSlice.length;
      features.push(sma !== 0 ? (p / sma) - 1 : 0);
    }
    if (featuresPerCandle >= 4) {
      // f3: volatility (stddev of last 5 returns)
      const rets = [];
      for (let k = Math.max(1, idx - 4); k <= idx; k++) {
        const rp = extended[k - 1] || 1;
        rets.push((extended[k] - rp) / rp);
      }
      const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
      const variance = rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length || 1);
      features.push(Math.sqrt(variance));
    }
    if (featuresPerCandle >= 5) {
      // f4: RSI-like (fraction of positive returns in sub-window)
      let ups = 0, total = 0;
      for (let k = Math.max(1, idx - 4); k <= idx; k++) {
        total++;
        if (extended[k] > extended[k - 1]) ups++;
      }
      features.push(total > 0 ? ups / total : 0.5);
    }
  }

  // Pad or truncate to exact inputDim
  while (features.length < inputDim) features.push(0);
  return features.slice(0, inputDim);
}

/* ─── Signal Extraction ────────────────────────────────────────────── */

export function getSignal(output) {
  const labels = ['buy', 'sell', 'hold'];
  const idx = output.indexOf(Math.max(...output));
  return { label: labels[idx], confidence: output[idx], probabilities: output };
}

/* ─── Model Validation ─────────────────────────────────────────────── */

export function validateModel(model) {
  if (!model || typeof model !== 'object')
    return { valid: false, error: 'File is not a valid JSON object' };
  if (!Array.isArray(model.layers) || model.layers.length === 0)
    return { valid: false, error: 'Model must have a non-empty "layers" array' };

  // Auto-assign name if missing (use Agent letter so nothing says "Unnamed")
  if (!model.name) {
    const letter = String.fromCharCode(65 + (Math.floor(Math.random() * 10))); // A-J
    model.name = `Agent ${letter}`;
  }

  // Use actual layer-0 input dimension (not inputWindow) for validation
  let prevDim = model.layers[0].weights.length;

  for (let i = 0; i < model.layers.length; i++) {
    const l = model.layers[i];
    if (!Array.isArray(l.weights) || !Array.isArray(l.bias))
      return { valid: false, error: `Layer ${i}: missing weights or bias array` };
    if (l.weights.length !== prevDim)
      return { valid: false, error: `Layer ${i}: weights rows (${l.weights.length}) ≠ previous dim (${prevDim})` };
    const outDim = l.bias.length;
    for (let r = 0; r < l.weights.length; r++) {
      if (!Array.isArray(l.weights[r]) || l.weights[r].length !== outDim)
        return { valid: false, error: `Layer ${i}, row ${r}: expected ${outDim} cols, got ${l.weights[r]?.length}` };
    }
    prevDim = outDim;
  }

  const lastBias = model.layers[model.layers.length - 1].bias;
  if (lastBias.length !== 3)
    return { valid: false, error: `Last layer must output 3 values (buy, sell, hold), got ${lastBias.length}` };

  return { valid: true };
}
