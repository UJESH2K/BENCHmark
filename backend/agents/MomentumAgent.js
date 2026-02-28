/**
 * MomentumAgent
 * Strategy: Tracks the direction of its signal over recent ticks.
 * If the signal has been consistently moving in one direction, it follows
 * the trend and bets accordingly. Has a cooldown to avoid overtrading.
 */
const BaseAgent = require("./BaseAgent");

class MomentumAgent extends BaseAgent {
  constructor(privateKey) {
    super(
      "MomentumAgent",
      privateKey,
      10,
      "ipfs://QmMomentumAgent-strategy-card"
    );
    this.signalNoise = 0.04;
    this.signalHistory = new Map();
    this.lookback = 3;
    this.trendThreshold = 0.02;
    this.tradeSize = 0.4;
    this.cooldown = new Map();
    this.cooldownPeriod = 2;
  }

  async decide(marketSnapshot) {
    const tradeIntents = [];

    for (const market of marketSnapshot.markets) {
      if (market.resolved) continue;

      const noise = (Math.random() - 0.5) * 2 * this.signalNoise;
      const signal = Math.max(0.01, Math.min(0.99, market.trueProbability + noise));

      if (!this.signalHistory.has(market.marketId)) {
        this.signalHistory.set(market.marketId, []);
        this.cooldown.set(market.marketId, 0);
      }

      const history = this.signalHistory.get(market.marketId);
      history.push(signal);

      const cd = this.cooldown.get(market.marketId);
      if (cd > 0) {
        this.cooldown.set(market.marketId, cd - 1);
        continue;
      }

      if (history.length < this.lookback + 1) continue;

      const recentChanges = [];
      for (let i = history.length - this.lookback; i < history.length; i++) {
        recentChanges.push(history[i] - history[i - 1]);
      }
      const avgChange = recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length;

      const marketPrice = market.impliedYesProb;
      const signalVsMarket = signal - marketPrice;

      if (Math.abs(avgChange) > this.trendThreshold && Math.abs(signalVsMarket) > 0.03) {
        const buyYes = avgChange > 0;

        tradeIntents.push({
          marketId: market.marketId,
          buyYes,
          amount: this.tradeSize,
          reason: `Trend ${avgChange.toFixed(4)}, signal ${signal.toFixed(3)} vs market ${marketPrice.toFixed(3)}`,
        });

        this.cooldown.set(market.marketId, this.cooldownPeriod);
      }
    }

    return tradeIntents;
  }
}

module.exports = MomentumAgent;
