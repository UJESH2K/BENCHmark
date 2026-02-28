/**
 * NaiveArbAgent
 * Strategy: Receives a noisy estimate of the true probability and compares it
 * to the on-chain implied probability. Bets when the market is significantly
 * mispriced relative to its signal. Simple threshold-based arbitrage.
 */
const BaseAgent = require("./BaseAgent");

class NaiveArbAgent extends BaseAgent {
  constructor(privateKey) {
    super(
      "NaiveArbAgent",
      privateKey,
      10,
      "ipfs://QmNaiveArbAgent-strategy-card"
    );
    this.signalNoise = 0.05;
    this.threshold = 0.07;
    this.tradeSize = 0.5;
  }

  async decide(marketSnapshot) {
    const tradeIntents = [];

    for (const market of marketSnapshot.markets) {
      if (market.resolved) continue;

      const noise = (Math.random() - 0.5) * 2 * this.signalNoise;
      const estimatedProb = Math.max(0.01, Math.min(0.99, market.trueProbability + noise));
      const marketPrice = market.impliedYesProb;
      const mispricing = estimatedProb - marketPrice;

      if (Math.abs(mispricing) > this.threshold) {
        const buyYes = mispricing > 0;
        tradeIntents.push({
          marketId: market.marketId,
          buyYes,
          amount: this.tradeSize,
          reason: `Signal ${estimatedProb.toFixed(3)} vs market ${marketPrice.toFixed(3)}, gap=${mispricing.toFixed(3)}`,
        });
      }
    }

    return tradeIntents;
  }
}

module.exports = NaiveArbAgent;
