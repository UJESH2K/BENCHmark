import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, ArrowUpCircle, ArrowDownCircle, PauseCircle,
  RotateCcw, DollarSign, Coins,
} from 'lucide-react';

import { ModelUploader } from './ModelUploader';
import { PortfolioChart, PriceSignalChart } from './ArenaChart';
import { predict, prepareFeatures, getSignal } from '../../lib/mlInference';

const INITIAL_CASH = 10_000;   // each agent starts with $10 000
const TRADE_FRACTION = 0.10;   // trade 10 % of available balance per signal
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

/* ====================================================================
   AgentArena – orchestrates the concurrent model battle
   ==================================================================== */

export const AgentArena = () => {
  /* ── state ─────────────────────────────────────────────────────── */
  const [models, setModels]         = useState(null);  // [model, model, model]
  const [arenaActive, setArenaActive] = useState(false);
  const [agents, setAgents]         = useState([]);    // per-agent portfolio state
  const [priceHistory, setPriceHistory] = useState([]); // raw BNB prices
  const [tickCount, setTickCount]   = useState(0);
  const [paused, setPaused]         = useState(false);
  const intervalRef = useRef(null);

  /* ── initialise agents when models are loaded ──────────────────── */
  const initAgents = useCallback((mods) => {
    return mods.map((m) => ({
      model: m,
      cash: INITIAL_CASH,
      bnb: 0,
      portfolioHistory: [],
      signals: [],
      trades: [],
      totalBuys: 0,
      totalSells: 0,
      totalHolds: 0,
    }));
  }, []);

  const handleModelsReady = (mods) => {
    setModels(mods);
    setAgents(initAgents(mods));
    setPriceHistory([]);
    setTickCount(0);
    setArenaActive(true);
    setPaused(false);
  };

  /* ── fetch live BNB price ──────────────────────────────────────── */
  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/gecko/price?ids=binancecoin&vs_currencies=usd`);
      const json = await res.json();
      return json?.binancecoin?.usd ?? null;
    } catch {
      return null;
    }
  }, []);

  /* ── one arena tick ────────────────────────────────────────────── */
  const tick = useCallback(async () => {
    const price = await fetchPrice();
    if (price === null) return;

    setPriceHistory(prev => {
      const next = [...prev, price];

      // Run inference on all agents
      setAgents(prevAgents => {
        return prevAgents.map(agent => {
          // Prepare features from full price history including new price
          const features = prepareFeatures(next, agent.model.inputWindow || 5, agent.model);
          const output   = predict(agent.model, features);
          const { label: signal, confidence, probabilities } = getSignal(output);

          // Clone agent state
          let { cash, bnb, trades, totalBuys, totalSells, totalHolds } = { ...agent };
          trades = [...trades];

          // Execute trade
          if (signal === 'buy' && cash > 1) {
            const spend  = cash * TRADE_FRACTION;
            const amount = spend / price;
            cash -= spend;
            bnb  += amount;
            totalBuys++;
            trades.push({ tick: next.length, type: 'buy', price, amount, confidence });
          } else if (signal === 'sell' && bnb > 0.0001) {
            const sellAmt = bnb * TRADE_FRACTION;
            const revenue = sellAmt * price;
            bnb  -= sellAmt;
            cash += revenue;
            totalSells++;
            trades.push({ tick: next.length, type: 'sell', price, amount: sellAmt, confidence });
          } else {
            totalHolds++;
          }

          const portfolioValue = cash + bnb * price;

          return {
            ...agent,
            cash,
            bnb,
            trades,
            totalBuys,
            totalSells,
            totalHolds,
            signals: [...agent.signals, signal],
            portfolioHistory: [
              ...agent.portfolioHistory,
              { time: Date.now(), value: portfolioValue },
            ],
          };
        });
      });

      return next;
    });

    setTickCount(prev => prev + 1);
  }, [fetchPrice]);

  /* ── start / stop interval ─────────────────────────────────────── */
  useEffect(() => {
    if (arenaActive && !paused) {
      tick(); // immediate first tick
      intervalRef.current = setInterval(tick, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [arenaActive, paused, tick]);

  /* ── reset ─────────────────────────────────────────────────────── */
  const handleReset = () => {
    setArenaActive(false);
    setPaused(false);
    setModels(null);
    setAgents([]);
    setPriceHistory([]);
    setTickCount(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  /* ── leaderboard sort ──────────────────────────────────────────── */
  const sorted = [...agents].sort((a, b) => {
    const va = a.cash + a.bnb * (priceHistory[priceHistory.length - 1] || 0);
    const vb = b.cash + b.bnb * (priceHistory[priceHistory.length - 1] || 0);
    return vb - va;
  });

  const medals = ['🥇', '🥈', '🥉'];

  /* ================================================================ */
  return (
    <div className="space-y-8">
      {/* ── Title ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Swords size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">AI Model Arena</h2>
          <p className="text-gray-400 text-sm">
            Upload 3 model weights &amp; watch them battle on live BNB prices
          </p>
        </div>
      </motion.div>

      {/* ── Uploader (before arena starts) ─────────────────────────── */}
      {!arenaActive && <ModelUploader onModelsReady={handleModelsReady} />}

      {/* ── Arena Active ───────────────────────────────────────────── */}
      <AnimatePresence>
        {arenaActive && (
          <motion.div
            key="arena"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-6"
          >
            {/* Controls bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 glass-card p-4">
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="font-mono bg-dark/50 px-3 py-1 rounded-lg">
                  Tick <span className="text-primary font-bold">{tickCount}</span>
                </span>
                <span className="font-mono bg-dark/50 px-3 py-1 rounded-lg">
                  BNB <span className="text-yellow-400 font-bold">
                    ${priceHistory[priceHistory.length - 1]?.toFixed(2) ?? '—'}
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaused(p => !p)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition cursor-pointer"
                >
                  {paused ? <ArrowUpCircle size={16} /> : <PauseCircle size={16} />}
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-sm transition cursor-pointer"
                >
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>

            {/* ── Leaderboard Cards ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sorted.map((agent, idx) => {
                const curPrice = priceHistory[priceHistory.length - 1] || 0;
                const value    = agent.cash + agent.bnb * curPrice;
                const pnl      = value - INITIAL_CASH;
                const pnlPct   = ((pnl / INITIAL_CASH) * 100).toFixed(2);
                const lastSig  = agent.signals[agent.signals.length - 1];

                return (
                  <motion.div
                    key={agent.model.name}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="glass-card p-5 space-y-3 border-l-4"
                    style={{ borderLeftColor: agent.model.color }}
                  >
                    {/* header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{medals[idx]}</span>
                        <h4 className="text-white font-bold">{agent.model.name}</h4>
                      </div>
                      {lastSig && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lastSig === 'buy'  ? 'bg-green-500/20 text-green-400' :
                          lastSig === 'sell' ? 'bg-red-500/20 text-red-400'   :
                                               'bg-gray-500/20 text-gray-400'
                        }`}>
                          {lastSig === 'buy' && <ArrowUpCircle size={12} className="inline mr-1" />}
                          {lastSig === 'sell' && <ArrowDownCircle size={12} className="inline mr-1" />}
                          {lastSig.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* metrics */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-dark/40 rounded-lg p-2">
                        <p className="text-gray-500 text-xs flex items-center gap-1"><DollarSign size={12} /> Portfolio</p>
                        <p className="text-white font-bold">${value.toFixed(2)}</p>
                      </div>
                      <div className="bg-dark/40 rounded-lg p-2">
                        <p className="text-gray-500 text-xs">P&amp;L</p>
                        <p className={`font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}{pnlPct}%
                        </p>
                      </div>
                      <div className="bg-dark/40 rounded-lg p-2">
                        <p className="text-gray-500 text-xs flex items-center gap-1"><Coins size={12} /> BNB</p>
                        <p className="text-yellow-400 font-bold">{agent.bnb.toFixed(4)}</p>
                      </div>
                      <div className="bg-dark/40 rounded-lg p-2">
                        <p className="text-gray-500 text-xs">Cash</p>
                        <p className="text-white font-bold">${agent.cash.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* signal bar */}
                    <div className="flex gap-1 text-[10px] text-gray-400">
                      <span className="text-green-400">{agent.totalBuys} buys</span>·
                      <span className="text-red-400">{agent.totalSells} sells</span>·
                      <span>{agent.totalHolds} holds</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Charts ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioChart agents={agents} />
              <PriceSignalChart priceHistory={priceHistory} agents={agents} />
            </div>

            {/* ── Recent Trades Log ───────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">📋 Recent Trades</h3>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {agents
                  .flatMap(a =>
                    a.trades.map(t => ({ ...t, agent: a.model.name, color: a.model.color }))
                  )
                  .sort((a, b) => b.tick - a.tick)
                  .slice(0, 50)
                  .map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-white/5 transition"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-gray-400 font-mono text-xs w-8">#{t.tick}</span>
                      <span className={`font-bold w-10 ${
                        t.type === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {t.type.toUpperCase()}
                      </span>
                      <span className="text-white">{t.agent}</span>
                      <span className="ml-auto text-gray-400 text-xs">
                        {t.amount.toFixed(4)} BNB @ ${t.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                {agents.every(a => a.trades.length === 0) && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Waiting for first trades…
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
