/**
 * MarketSimulator
 * Generates synthetic prediction market events and pushes them to the blockchain.
 * Creates multiple markets with evolving "true probabilities" that agents must discover.
 */
const { ethers } = require("ethers");
const { getSigner, getContracts } = require("./contractHelper");
require("dotenv").config();

class MarketSimulator {
  constructor() {
    this.deployer = getSigner(process.env.DEPLOYER_PRIVATE_KEY);
    this.contracts = getContracts(this.deployer);
    this.marketStates = new Map(); // marketId => { trueProbability, drift, volatility }
    this.tickCount = 0;
  }

  /**
   * Create initial prediction markets on-chain.
   */
  async createMarkets(marketConfigs) {
    console.log("[Simulator] Creating markets...");
    const createdIds = [];

    for (const config of marketConfigs) {
      const resolutionTime = Math.floor(Date.now() / 1000) + config.durationSeconds;
      console.log(`[Simulator] Creating market: "${config.question}"`);
      
      try {
        const tx = await this.contracts.marketRegistry.createMarket(config.question, resolutionTime);
        console.log(`[Simulator] Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`[Simulator] Receipt received. Logs count: ${receipt?.logs?.length || 0}`);

        if (!receipt || !receipt.logs || receipt.logs.length === 0) {
          console.error("[Simulator] No logs in receipt for market creation");
          console.error("[Simulator] Receipt:", JSON.stringify(receipt, null, 2));
          throw new Error("Market creation failed - no event logs");
        }

        // Parse event to get market ID
        let event = null;
        let lastError = null;
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          try {
            console.log(`[Simulator] Checking log ${i}: topics=${JSON.stringify(log.topics?.slice(0, 2))}`);
            const parsed = this.contracts.marketRegistry.interface.parseLog(log);
            console.log(`[Simulator] Log ${i} parsed: ${parsed?.name || 'UNKNOWN'}`);
            if (parsed && parsed.name === "MarketCreated") {
              event = log;
              console.log(`[Simulator] Found MarketCreated event at log ${i}`);
              break;
            }
          } catch (e) { 
            lastError = e;
            console.log(`[Simulator] Log ${i} parse error: ${e.message}`);
            // silently skip non-MarketRegistry logs
          }
        }

        if (!event) {
          console.error("[Simulator] MarketCreated event not found in logs");
          console.error("[Simulator] Last error:", lastError?.message);
          console.error("[Simulator] Available logs (count):", receipt.logs.length);
          if (receipt.logs.length > 0) {
            console.error("[Simulator] First log topics:", receipt.logs[0].topics);
          }
          throw new Error("MarketCreated event not found");
        }

        const parsed = this.contracts.marketRegistry.interface.parseLog(event);
        const marketId = Number(parsed.args.marketId);

        // Initialize internal state for simulation
        this.marketStates.set(marketId, {
          trueProbability: config.initialProbability || 0.5,
          drift: config.drift || 0,        // tendency to move toward YES or NO
          volatility: config.volatility || 0.05,
          question: config.question,
        });

        createdIds.push(marketId);
        console.log(`  Market #${marketId}: "${config.question}" (resolves in ${config.durationSeconds}s)`);
      } catch (err) {
        console.error(`[Simulator] Error creating market: ${err.message}`);
        throw err;
      }
    }

    return createdIds;
  }

  /**
   * Simulate one tick: evolve true probabilities and return current market states.
   */
  async tick() {
    this.tickCount++;
    const marketSnapshots = [];

    for (const [marketId, state] of this.marketStates) {
      // Random walk with drift
      const noise = (Math.random() - 0.5) * 2 * state.volatility;
      state.trueProbability = Math.max(0.01, Math.min(0.99,
        state.trueProbability + state.drift + noise
      ));

      // Read on-chain pools to get current market price
      const market = await this.contracts.marketRegistry.getMarket(marketId);
      const yesPool = Number(ethers.formatEther(market.yesPool));
      const noPool = Number(ethers.formatEther(market.noPool));
      const impliedYesProb = noPool / (yesPool + noPool);

      marketSnapshots.push({
        marketId,
        question: state.question,
        trueProbability: state.trueProbability,
        impliedYesProb,
        yesPool,
        noPool,
        resolved: market.resolved,
        totalVolume: Number(ethers.formatEther(market.totalVolume)),
      });
    }

    return {
      tick: this.tickCount,
      timestamp: Date.now(),
      markets: marketSnapshots,
    };
  }

  /**
   * Resolve all markets based on true probabilities.
   */
  async resolveAll() {
    console.log("[Simulator] Resolving all markets...");
    for (const [marketId, state] of this.marketStates) {
      // Outcome determined by final true probability
      const outcome = state.trueProbability >= 0.5 ? 1 : 2; // 1=YES, 2=NO
      try {
        const tx = await this.contracts.marketRegistry.resolveMarket(marketId, outcome);
        await tx.wait();
        console.log(`  Market #${marketId} resolved to ${outcome === 1 ? "YES" : "NO"} (true prob: ${state.trueProbability.toFixed(3)})`);
      } catch (err) {
        console.log(`  Market #${marketId} already resolved or error: ${err.message}`);
      }
    }
  }

  getMarketStates() {
    return this.marketStates;
  }
}

module.exports = MarketSimulator;
