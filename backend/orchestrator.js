/**
 * Orchestrator
 * The main backend engine that:
 * 1. Creates prediction markets
 * 2. Registers and funds AI agents
 * 3. Runs simulation ticks
 * 4. Collects agent decisions and executes trades on-chain
 * 5. Logs everything and computes performance metrics
 * 6. Exposes REST API for the frontend
 */
const express = require("express");
const cors = require("cors");
// node-fetch v3 is ESM; require returns a function under .default
let fetchLib;
try {
  fetchLib = require("node-fetch");
  fetchLib = fetchLib.default || fetchLib;
} catch {
  fetchLib = (...args) => import("node-fetch").then(m => m.default(...args));
}
// ensure global.fetch is available for convenience
if (typeof global.fetch !== "function") {
  global.fetch = fetchLib;
}
const { ethers } = require("ethers");
const MarketSimulator = require("./marketSimulator");
const NaiveArbAgent = require("./agents/NaiveArbAgent");
const MeanRevertAgent = require("./agents/MeanRevertAgent");
const MomentumAgent = require("./agents/MomentumAgent");
const { getSigner, getContracts } = require("./contractHelper");
const LiveArena = require("./liveArena");
require("dotenv").config();

// ─── Configuration ───────────────────────────────────────────────
const TICK_INTERVAL_MS = 5000;     // 5 seconds per tick
const TOTAL_TICKS = 30;            // 30 ticks per simulation run
const DEPOSIT_AMOUNT_ETH = "50";   // Each agent gets 50 BNB deposited

// ─── Global State ────────────────────────────────────────────────
let simulator = null;
let agents = [];
let simulationLog = [];
let tickData = [];
let isRunning = false;
let currentTick = 0;
let simulationStatus = "idle"; // idle | running | completed

// ─── Market Configurations ───────────────────────────────────────
const MARKET_CONFIGS = [
  {
    question: "Will BTC be above $100k by end of March 2026?",
    durationSeconds: 3600,
    initialProbability: 0.55,
    drift: 0.002,
    volatility: 0.06,
  },
  {
    question: "Will ETH flip BNB in TVL this quarter?",
    durationSeconds: 3600,
    initialProbability: 0.4,
    drift: -0.001,
    volatility: 0.08,
  },
  {
    question: "Will the next Fed meeting cut rates?",
    durationSeconds: 3600,
    initialProbability: 0.6,
    drift: 0.003,
    volatility: 0.04,
  },
];

// ─── RPC availability check ─────────────────────────────────────
let rpcAvailable = false;
async function checkRPC() {
  try {
    const p = getProvider();
    await p.getBlockNumber();
    rpcAvailable = true;
    console.log('[RPC] Connected to', process.env.RPC_URL || 'http://127.0.0.1:8545');
  } catch {
    rpcAvailable = false;
    console.log('[RPC] No blockchain node available — running in API-only mode (arena + live data still work)');
  }
}

// ─── Setup ───────────────────────────────────────────────────────
async function setupSimulation() {
  console.log("=== AGENTS PLAYGROUND - Setting Up ===\n");

  // 1. Create simulator and markets
  simulator = new MarketSimulator();
  const marketIds = await simulator.createMarkets(MARKET_CONFIGS);
  console.log(`\nCreated ${marketIds.length} markets.\n`);

  // 2. Create agents
  agents = [
    new NaiveArbAgent(process.env.AGENT1_PRIVATE_KEY),
    new MeanRevertAgent(process.env.AGENT2_PRIVATE_KEY),
    new MomentumAgent(process.env.AGENT3_PRIVATE_KEY),
  ];

  if (rpcAvailable) {
    // 3. Register agents on-chain
    for (const agent of agents) {
      await agent.register();
    }

    // 4. Fund agents: deployer deposits BNB into vault for each agent
    const deployer = getSigner(process.env.DEPLOYER_PRIVATE_KEY);
    const deployerContracts = getContracts(deployer);

    for (const agent of agents) {
      console.log(`[Setup] Depositing ${DEPOSIT_AMOUNT_ETH} BNB into vault for agent #${agent.agentId}...`);
      const tx = await deployerContracts.agentVault.deposit(agent.agentId, {
        value: ethers.parseEther(DEPOSIT_AMOUNT_ETH),
      });
      await tx.wait();
      const balance = await deployerContracts.agentVault.getAgentBalance(agent.agentId);
      console.log(`  Vault balance: ${ethers.formatEther(balance)} BNB`);
    }
  } else {
    console.log('[Setup] Skipping on-chain registration (no RPC). Agents run in simulated mode.');
    agents.forEach((a, i) => { a.agentId = i + 1; });
  }

  console.log("\n=== Setup Complete ===\n");
}

// ─── Simulation Loop ─────────────────────────────────────────────
async function runSimulation() {
  isRunning = true;
  simulationStatus = "running";
  currentTick = 0;
  simulationLog = [];
  tickData = [];

  console.log("=== SIMULATION STARTED ===\n");

  for (let t = 0; t < TOTAL_TICKS; t++) {
    currentTick = t + 1;
    console.log(`\n─── Tick ${currentTick}/${TOTAL_TICKS} ───`);

    // 1. Simulator tick: evolve markets
    const snapshot = await simulator.tick();
    console.log("Markets:");
    for (const m of snapshot.markets) {
      console.log(`  #${m.marketId} "${m.question.substring(0, 40)}..." | Implied YES: ${(m.impliedYesProb * 100).toFixed(1)}% | True: ${(m.trueProbability * 100).toFixed(1)}%`);
    }

    // 2. Collect decisions from all agents
    const tickLog = {
      tick: currentTick,
      timestamp: Date.now(),
      markets: snapshot.markets,
      trades: [],
      agentSummaries: [],
    };

    for (const agent of agents) {
      try {
        const intents = await agent.decide(snapshot);

        for (const intent of intents) {
          console.log(`  [${agent.name}] Intent: ${intent.buyYes ? "BUY YES" : "BUY NO"} market #${intent.marketId} | ${intent.amount} BNB | ${intent.reason}`);
          const trade = await agent.executeTrade(intent.marketId, intent.buyYes, intent.amount);
          if (trade) {
            tickLog.trades.push(trade);
          }
        }

        if (intents.length === 0) {
          console.log(`  [${agent.name}] No trade this tick.`);
        }
      } catch (err) {
        console.error(`  [${agent.name}] Error: ${err.message}`);
      }

      tickLog.agentSummaries.push(agent.getSummary());
    }

    tickData.push(tickLog);
    simulationLog.push(tickLog);

    // Wait for next tick
    if (t < TOTAL_TICKS - 1) {
      await new Promise((resolve) => setTimeout(resolve, TICK_INTERVAL_MS));
    }
  }

  // 3. Resolve markets
  console.log("\n=== RESOLVING MARKETS ===");
  await simulator.resolveAll();

  // 4. Final summary
  console.log("\n=== FINAL RESULTS ===");
  for (const agent of agents) {
    const summary = agent.getSummary();
    console.log(`\n${summary.name} (Agent #${summary.agentId}):`);
    console.log(`  Total trades: ${summary.totalTrades}`);
    console.log(`  Positions:`, JSON.stringify(summary.positions));
  }

  simulationStatus = "completed";
  isRunning = false;
  console.log("\n=== SIMULATION COMPLETE ===");
}

// ─── Express API Server ──────────────────────────────────────────
function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Serve built frontend in production
  const frontendDist = require('path').join(__dirname, '..', 'frontend', 'dist');
  if (require('fs').existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", simulationStatus, currentTick, totalTicks: TOTAL_TICKS });
  });

  // Start simulation
  app.post("/api/simulation/start", async (req, res) => {
    if (isRunning) {
      return res.status(400).json({ error: "Simulation already running" });
    }
    try {
      console.log("[API] Starting simulation setup...");
      await setupSimulation();
      console.log("[API] Setup complete, starting simulation in background");
      // Run simulation in background (don't await)
      runSimulation().catch((err) => {
        console.error("[Simulation Error]", err);
      });
      res.json({ message: "Simulation started", totalTicks: TOTAL_TICKS });
    } catch (err) {
      console.error("[API] Setup error:", err.message);
      console.error("[API] Stack:", err.stack);
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  // Get simulation status (both /api/status and /api/simulation/status)
  const statusHandler = (req, res) => {
    res.json({
      status: simulationStatus,
      currentTick,
      totalTicks: TOTAL_TICKS,
      isRunning,
    });
  };
  app.get("/api/status", statusHandler);
  app.get("/api/simulation/status", statusHandler);

  // Get markets
  app.get("/api/markets", async (req, res) => {
    try {
      if (!simulator) {
        return res.json([]);
      }
      
      const marketStates = simulator.getMarketStates();
      const markets = [];

      if (rpcAvailable) {
        const contracts = getContracts(getSigner(process.env.DEPLOYER_PRIVATE_KEY));
        for (const [marketId, state] of marketStates) {
          try {
            const market = await contracts.marketRegistry.getMarket(marketId);
            const yesPool = Number(ethers.formatEther(market.yesPool));
            const noPool = Number(ethers.formatEther(market.noPool));
            const impliedYesProb = noPool / (yesPool + noPool) || 0;
            markets.push({
              marketId,
              question: state.question,
              trueProbability: state.trueProbability,
              impliedYesProb,
              yesPool,
              noPool,
              resolved: market.resolved,
              totalVolume: Number(ethers.formatEther(market.totalVolume)),
            });
          } catch (err) {
            console.error(`Error fetching market ${marketId}:`, err.message);
          }
        }
      } else {
        // Fallback: use simulated market state
        for (const [marketId, state] of marketStates) {
          markets.push({
            marketId,
            question: state.question,
            trueProbability: state.trueProbability,
            impliedYesProb: state.trueProbability,
            yesPool: 100,
            noPool: 100,
            resolved: false,
            totalVolume: 0,
          });
        }
      }
      
      res.json(markets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get agents
  app.get("/api/agents", (req, res) => {
    res.json(agents.map((a) => a.getSummary()));
  });

  // Get trade log (all agents)
  app.get("/api/trades", (req, res) => {
    const allTrades = agents.flatMap((a) => a.getTradeLog());
    allTrades.sort((a, b) => a.tick - b.tick);
    res.json(allTrades);
  });

  // Get tick data (for charts)
  app.get("/api/ticks", (req, res) => {
    res.json(tickData);
  });

  // Get latest tick
  app.get("/api/ticks/latest", (req, res) => {
    if (tickData.length === 0) {
      return res.json(null);
    }
    res.json(tickData[tickData.length - 1]);
  });

  // Get leaderboard
  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = agents.map((a) => {
      const summary = a.getSummary();
      return {
        agentId: summary.agentId,
        name: summary.name,
        address: summary.address,
        totalTrades: summary.totalTrades,
        positions: summary.positions,
      };
    });
    // Sort by total trades for now (PnL calculation needs market resolution)
    leaderboard.sort((a, b) => b.totalTrades - a.totalTrades);
    res.json(leaderboard);
  });

  // Get deployed contract addresses
  app.get("/api/contracts", (req, res) => {
    try {
      const addresses = require("../deployed-addresses.json");
      res.json(addresses);
    } catch {
      res.json({ error: "No deployed addresses found" });
    }
  });

  // ------------------------------------------------------------------
  // CoinPaprika proxy endpoints (live market data)
  // ------------------------------------------------------------------
  const COINP_API_KEY = process.env.COINP_API_KEY || "";
  async function proxyCoinPaprika(path, query = {}) {
    const url = new URL("https://api.coinpaprika.com/v1" + path);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    if (COINP_API_KEY) {
      // some tiers expect header, some query param; include both just in case
      url.searchParams.set("apikey", COINP_API_KEY);
    }
    const headers = {};
    if (COINP_API_KEY) {
      headers["X-API-Key"] = COINP_API_KEY;
    }

    const resp = await fetch(url.toString(), { headers });
    return resp.json();
  }

  // ----------------------------------------
  // CoinPaprika proxy (legacy, may hit limits)
  // ----------------------------------------
  app.get("/api/live/exchanges", async (req, res) => {
    try {
      const { quotes } = req.query;
      const data = await proxyCoinPaprika("/exchanges", { quotes: quotes || "USD" });
      res.json(data);
    } catch (err) {
      console.error("CoinPaprika error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/live/tickers", async (req, res) => {
    try {
      const { quotes } = req.query;
      const data = await proxyCoinPaprika("/tickers", { quotes: quotes || "USD" });
      res.json(data);
    } catch (err) {
      console.error("CoinPaprika error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------
  // CoinGecko proxy endpoints (free tier)
  // ----------------------------------------
  const COINGECKO_KEY = process.env.COINGECKO_API_KEY || "";
  function geckoUrl(path, query = {}) {
    const url = new URL("https://api.coingecko.com/api/v3" + path);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    if (COINGECKO_KEY) url.searchParams.set("x_cg_demo_api_key", COINGECKO_KEY);
    return url.toString();
  }

  // Shared BNB price cache (used by gecko endpoint + arena)
  let _cachedPrice = null;
  let _cacheTs = 0;
  const PRICE_CACHE_MS = 12_000;  // 12 sec TTL

  // simple price by ids (uses shared cache for BNB to avoid 429)
  app.get("/api/gecko/price", async (req, res) => {
    try {
      const { ids = "binancecoin", vs_currencies = "usd" } = req.query;
      // If requesting BNB/USD (most common), use the shared cache
      if (ids === "binancecoin" && vs_currencies === "usd" && _cachedPrice && Date.now() - _cacheTs < PRICE_CACHE_MS) {
        return res.json({ binancecoin: { usd: _cachedPrice } });
      }
      const url = geckoUrl("/simple/price", { ids, vs_currencies });
      const resp = await fetch(url);
      const data = await resp.json();
      // Update cache opportunistically
      if (ids === "binancecoin" && data?.binancecoin?.usd) {
        _cachedPrice = data.binancecoin.usd;
        _cacheTs = Date.now();
      }
      res.json(data);
    } catch (err) {
      // Return cached data on error
      if (_cachedPrice) return res.json({ binancecoin: { usd: _cachedPrice } });
      console.error("CoinGecko error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // you can add other gecko endpoints as needed

  // ──────────────────────────────────────────────────────────────────
  // LIVE ARENA (multiplayer model marketplace)
  // ──────────────────────────────────────────────────────────────────
  // Cached BNB price fetcher (avoids 429 rate limit on CoinGecko free tier)
  // (variables declared here so they're also accessible by gecko/price endpoint above)

  async function fetchBnbPriceCached() {
    if (_cachedPrice && Date.now() - _cacheTs < PRICE_CACHE_MS) return _cachedPrice;
    try {
      const url = geckoUrl("/simple/price", { ids: "binancecoin", vs_currencies: "usd" });
      const resp = await fetch(url);
      const data = await resp.json();
      const price = data?.binancecoin?.usd ?? null;
      if (price) { _cachedPrice = price; _cacheTs = Date.now(); }
      return price;
    } catch { return _cachedPrice; }   // return stale on error
  }

  const arena = new LiveArena(fetchBnbPriceCached);
  arena.restoreFromSupabase().then(() => arena.start());   // restore then tick

  // Join arena
  app.post("/api/arena/join", (req, res) => {
    const { wallet, model } = req.body;
    if (!wallet || !model) return res.status(400).json({ error: "wallet and model required" });
    const result = arena.join(wallet, model);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ message: "Joined arena", wallet: wallet.toLowerCase() });
  });

  // Leave arena
  app.delete("/api/arena/leave/:wallet", (req, res) => {
    const result = arena.leave(req.params.wallet);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ message: "Left arena" });
  });

  // Arena status (tick count, running, price history)
  app.get("/api/arena/status", (req, res) => {
    res.json(arena.getStatus());
  });

  // Global leaderboard
  app.get("/api/arena/leaderboard", (req, res) => {
    res.json(arena.getLeaderboard());
  });

  // Recent trades feed
  app.get("/api/arena/trades", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    res.json(arena.getRecentTrades(limit));
  });

  // Fighter detail by wallet
  app.get("/api/arena/fighter/:wallet", (req, res) => {
    const detail = arena.getFighterDetail(req.params.wallet);
    if (!detail) return res.status(404).json({ error: "Fighter not found" });
    res.json(detail);
  });

  // Portfolio chart data (all fighters)
  app.get("/api/arena/portfolios", (req, res) => {
    res.json(arena.getPortfolioChartData());
  });


  const PORT = process.env.PORT || 3000;

  // Catch-all: serve frontend index.html for client-side routing
  if (require('fs').existsSync(frontendDist)) {
    app.get('{*path}', (req, res) => {
      res.sendFile(require('path').join(frontendDist, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 API Server running on 0.0.0.0:${PORT}`);
    console.log(`  POST /api/simulation/start - Start simulation`);
    console.log(`  GET  /api/simulation/status - Get status`);
    console.log(`  GET  /api/agents - List agents`);
    console.log(`  GET  /api/trades - All trades`);
    console.log(`  GET  /api/ticks - All tick data`);
    console.log(`  GET  /api/leaderboard - Agent leaderboard`);
    console.log(`  ── Live Arena ──`);
    console.log(`  POST /api/arena/join - Join arena`);
    console.log(`  DELETE /api/arena/leave/:wallet - Leave`);
    console.log(`  GET  /api/arena/status - Arena status`);
    console.log(`  GET  /api/arena/leaderboard - Global leaderboard`);
    console.log(`  GET  /api/arena/trades - Trade stream`);
    console.log(`  GET  /api/arena/fighter/:wallet - Fighter detail\n`);
  });
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  await checkRPC();
  startServer();
}

main().catch(console.error);
