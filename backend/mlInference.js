/**
 * Server-side ML inference engine (CommonJS mirror of frontend version)
 */

let globalAgentCounter = 0;

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

function predict(model, input) {
  let x = [...input];
  for (const layer of model.layers) {
    x = dense(x, layer.weights, layer.bias);
    const act = activations[layer.activation || "relu"];
    x = act(x);
  }
  return x;
}

function prepareFeatures(prices, windowSize = 5, model = null) {
  const inputDim = model?.layers?.[0]?.weights?.length ?? windowSize;
  const needed = Math.max(windowSize, 20);
  if (prices.length < needed) {
    const pad = new Array(needed - prices.length).fill(prices[0] || 1);
    prices = [...pad, ...prices];
  }
  const win = prices.slice(-windowSize);
  const base = win[0] || 1;
  if (inputDim === windowSize) return win.map(p => (p / base) - 1);

  const featuresPerCandle = Math.floor(inputDim / windowSize) || 5;
  const extended = prices.slice(-(windowSize + 10));
  const features = [];

  for (let i = 0; i < windowSize; i++) {
    const idx = extended.length - windowSize + i;
    const p    = extended[idx];
    const prev = extended[idx - 1] || p;
    features.push((p / base) - 1);
    if (featuresPerCandle >= 2) features.push(prev !== 0 ? (p - prev) / prev : 0);
    if (featuresPerCandle >= 3) {
      const smaSlice = extended.slice(Math.max(0, idx - 4), idx + 1);
      const sma = smaSlice.reduce((a, b) => a + b, 0) / smaSlice.length;
      features.push(sma !== 0 ? (p / sma) - 1 : 0);
    }
    if (featuresPerCandle >= 4) {
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
      let ups = 0, total = 0;
      for (let k = Math.max(1, idx - 4); k <= idx; k++) {
        total++;
        if (extended[k] > extended[k - 1]) ups++;
      }
      features.push(total > 0 ? ups / total : 0.5);
    }
  }

  while (features.length < inputDim) features.push(0);
  return features.slice(0, inputDim);
}

function getSignal(output) {
  const labels = ["buy", "sell", "hold"];
  const idx = output.indexOf(Math.max(...output));
  return { label: labels[idx], confidence: output[idx], probabilities: output };
}

function validateModel(model) {
  if (!model || typeof model !== "object")
    return { valid: false, error: "Not a valid JSON object" };
  if (!Array.isArray(model.layers) || model.layers.length === 0)
    return { valid: false, error: 'Must have a non-empty "layers" array' };
  if (!model.name) {
    const letter = String.fromCharCode(65 + (globalAgentCounter++ % 10)); // A-J
    model.name = `Agent ${letter}`;
  }

  let prevDim = model.layers[0].weights.length;
  for (let i = 0; i < model.layers.length; i++) {
    const l = model.layers[i];
    if (!Array.isArray(l.weights) || !Array.isArray(l.bias))
      return { valid: false, error: `Layer ${i}: missing weights/bias` };
    if (l.weights.length !== prevDim)
      return { valid: false, error: `Layer ${i}: dim mismatch` };
    const outDim = l.bias.length;
    for (let r = 0; r < l.weights.length; r++) {
      if (!Array.isArray(l.weights[r]) || l.weights[r].length !== outDim)
        return { valid: false, error: `Layer ${i}, row ${r}: bad shape` };
    }
    prevDim = outDim;
  }
  const lastBias = model.layers[model.layers.length - 1].bias;
  if (lastBias.length !== 3)
    return { valid: false, error: `Last layer must output 3, got ${lastBias.length}` };
  return { valid: true };
}

module.exports = { predict, prepareFeatures, getSignal, validateModel };
