/**
 * BaseAgent
 * Abstract base class for all AI trading agents.
 * Each agent connects to the blockchain, registers itself, and implements a strategy.
 */
const { ethers } = require("ethers");
const { getSigner, getContracts } = require("../contractHelper");
require("dotenv").config();

class BaseAgent {
  constructor(name, privateKey, riskLimitEth, agentCardURI) {
    this.name = name;
    this.riskLimitEth = riskLimitEth;
    this.agentCardURI = agentCardURI;
    this.agentId = null;
    this.tradeLog = [];
    this.totalPnL = 0;
    this.positions = new Map(); // marketId => { side: 'YES'|'NO', tokens: number, cost: number }

    // Gracefully handle missing RPC — allow simulated-only mode
    try {
      this.signer = getSigner(privateKey);
      this.contracts = getContracts(this.signer);
      this.agentAddress = this.signer.signer?.address || this.signer.address;
    } catch (err) {
      console.log(`[${this.name}] Running in simulated mode (no RPC): ${err.message}`);
      this.signer = null;
      this.contracts = null;
      // Derive address from private key without provider
      try {
        const wallet = new ethers.Wallet(privateKey);
        this.agentAddress = wallet.address;
      } catch {
        this.agentAddress = `0xSIM${Math.random().toString(16).slice(2, 10)}`;
      }
    }
  }

  async register() {
    console.log(`[${this.name}] Registering agent...`);
    try {
      const existingId = await this.contracts.agentRegistry.agentIdByOwner(this.agentAddress);
      if (existingId > 0n) {
        this.agentId = Number(existingId);
        console.log(`[${this.name}] Already registered with ID ${this.agentId}`);
        return this.agentId;
      }
    } catch {}

    const riskLimitWei = ethers.parseEther(this.riskLimitEth.toString());
    const tx = await this.contracts.agentRegistry.registerAgent(riskLimitWei, this.agentCardURI);
    const receipt = await tx.wait();

    if (!receipt || !receipt.logs || receipt.logs.length === 0) {
      throw new Error(`[${this.name}] No logs in receipt for agent registration`);
    }

    let event = null;
    for (const log of receipt.logs) {
      try {
        const parsed = this.contracts.agentRegistry.interface.parseLog(log);
        if (parsed && parsed.name === "AgentRegistered") {
          event = log;
          break;
        }
      } catch {
        // silently skip non-AgentRegistry logs
      }
    }

    if (!event) {
      throw new Error(`[${this.name}] AgentRegistered event not found`);
    }

    const parsed = this.contracts.agentRegistry.interface.parseLog(event);
    this.agentId = Number(parsed.args.agentId);

    console.log(`[${this.name}] Registered with ID ${this.agentId} (address: ${this.agentAddress})`);
    return this.agentId;
  }

  /**
   * Execute a trade through the TradeExecutionProxy.
   * @param {number} marketId 
   * @param {boolean} buyYes - true = buy YES, false = buy NO
   * @param {number} amountEth - amount in ETH/BNB
   */
  async executeTrade(marketId, buyYes, amountEth) {
    // If no RPC / contracts, run in simulated mode
    if (!this.contracts) {
      const tokensReceived = amountEth * (0.8 + Math.random() * 0.4); // simulated fill
      const tradeEntry = {
        tick: Date.now(),
        agentId: this.agentId,
        agentName: this.name,
        marketId,
        side: buyYes ? "YES" : "NO",
        amount: amountEth,
        tokensReceived,
        txHash: `0xsim${Date.now().toString(16)}`,
        size: amountEth,
      };
      this.tradeLog.push(tradeEntry);
      const existing = this.positions.get(marketId) || { side: null, tokens: 0, cost: 0 };
      const side = buyYes ? "YES" : "NO";
      if (existing.side === side || existing.side === null) {
        existing.side = side;
        existing.tokens += tokensReceived;
        existing.cost += amountEth;
      } else {
        existing.tokens -= tokensReceived;
        existing.cost -= amountEth;
      }
      this.positions.set(marketId, existing);
      console.log(`[${this.name}] Sim Trade: ${buyYes ? "BUY YES" : "BUY NO"} on market #${marketId} | ${amountEth} BNB -> ${tokensReceived.toFixed(4)} tokens`);
      return tradeEntry;
    }

    const amountWei = ethers.parseEther(amountEth.toString());
    try {
      const tx = await this.contracts.tradeProxy.executeTrade(marketId, buyYes, amountWei);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return this.contracts.tradeProxy.interface.parseLog(log)?.name === "TradeExecuted";
        } catch { return false; }
      });

      let tokensReceived = 0;
      if (event) {
        const parsed = this.contracts.tradeProxy.interface.parseLog(event);
        tokensReceived = Number(ethers.formatEther(parsed.args.tokensReceived));
      }

      const tradeEntry = {
        tick: Date.now(),
        agentId: this.agentId,
        agentName: this.name,
        marketId,
        side: buyYes ? "YES" : "NO",
        amount: amountEth,
        tokensReceived,
        txHash: receipt.hash,
      };
      this.tradeLog.push(tradeEntry);

      // Track position
      const existing = this.positions.get(marketId) || { side: null, tokens: 0, cost: 0 };
      const side = buyYes ? "YES" : "NO";
      if (existing.side === side || existing.side === null) {
        existing.side = side;
        existing.tokens += tokensReceived;
        existing.cost += amountEth;
      } else {
        // Closing position partially
        existing.tokens -= tokensReceived;
        existing.cost -= amountEth;
      }
      this.positions.set(marketId, existing);

      console.log(`[${this.name}] Trade: ${buyYes ? "BUY YES" : "BUY NO"} on market #${marketId} | ${amountEth} BNB -> ${tokensReceived.toFixed(4)} tokens`);
      return tradeEntry;
    } catch (err) {
      console.error(`[${this.name}] Trade failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Override in subclasses. Called each tick with market data.
   * Should return array of trade intents: [{ marketId, buyYes, amount }]
   */
  async decide(marketSnapshot) {
    throw new Error("decide() must be implemented by subclass");
  }

  getTradeLog() {
    return this.tradeLog;
  }

  getPositions() {
    return Object.fromEntries(this.positions);
  }

  getSummary() {
    return {
      name: this.name,
      agentId: this.agentId,
      address: this.agentAddress,
      totalTrades: this.tradeLog.length,
      positions: this.getPositions(),
    };
  }
}

module.exports = BaseAgent;
