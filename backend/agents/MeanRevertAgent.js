/**
 * MeanRevertAgent
 * Strategy: Maintains an EMA of its own signal (noisy true probability).
 * Trades when the market implied probability diverges from its EMA signal.
 * Uses adaptive position sizing based on divergence magnitude.
 */
const BaseAgent = require("./BaseAgent");

class MeanRevertAgent extends BaseAgent {
  constructor(privateKey) {
    super(
      "MeanRevertAgent",
      privateKey,
      10,
      "ipfs://QmMeanRevertAgent-strategy-card"
    );
    this.signalNoise = 0.03;
    this.emas = new Map();
    this.alpha = 0.4;
    this.threshold = 0.05;
    this.baseTradeSize = 0.3;
    this.maxTradeSize = 1.0;
  }

  async decide(marketSnapshot) {
    const tradeIntents = [];

    for (const market of marketSnapshot.markets) {
      if (market.resolved) continue;

      const noise = (Math.random() - 0.5) * 2 * this.signalNoise;
      const signal = Math.max(0.01, Math.min(0.99, market.trueProbability + noise));

      if (!this.emas.has(market.marketId)) {
        this.emas.set(market.marketId, signal);
        continue;
      }

      const prevEma = this.emas.get(market.marketId);
      const newEma = this.alpha * signal + (1 - this.alpha) * prevEma;
      this.emas.set(market.marketId, newEma);

      const marketPrice = market.impliedYesProb;
      const divergence = newEma - marketPrice;

      if (Math.abs(divergence) > this.threshold) {
        const scaleFactor = Math.min(Math.abs(divergence) / this.threshold, 3);
        const tradeSize = Math.min(this.baseTradeSize * scaleFactor, this.maxTradeSize);
        const buyYes = divergence > 0;

        tradeIntents.push({
          marketId: market.marketId,
          buyYes,
          amount: parseFloat(tradeSize.toFixed(4)),
          reason: `EMA signal ${newEma.toFixed(3)} vs market ${marketPrice.toFixed(3)}, div=${divergence.toFixed(3)}`,
        });
      }
    }

    return tradeIntents;
  }
}

module.exports = MeanRevertAgent;
