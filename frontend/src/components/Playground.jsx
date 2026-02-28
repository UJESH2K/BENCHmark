import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BarChart3, TrendingUp, AlertCircle, Swords, Globe } from 'lucide-react';
import { SimulationMonitor } from "./Visualization/SimulationMonitor";
import { MarketChart } from "./Visualization/MarketChart";
import { TradeHistory } from "./Visualization/TradeHistory";
import { AgentPerformance } from "./Visualization/AgentPerformance";
import { AgentComparisonDemo } from "./Visualization/AgentComparisonDemo";
import { LiveTickerChart } from "./Visualization/LiveTickerChart";
import { AgentArena } from "./Arena/AgentArena";
import { ArenaLive } from "./Arena/ArenaLive";

export const Playground = () => {
  const [activeTab, setActiveTab] = useState('live-arena');  // 'live-arena' | 'arena' | 'simulation'
  const [isRunning, setIsRunning] = useState(false);
  const [currentTick, setCurrentTick] = useState(0);
  const [totalTicks, setTotalTicks] = useState(30);
  const [markets, setMarkets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [trades, setTrades] = useState([]);
  const [tickData, setTickData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMarketId, setActiveMarketId] = useState(null);
  const [error, setError] = useState(null);
  const [showDemo, setShowDemo] = useState(true);
  const [liveExchanges, setLiveExchanges] = useState([]);
  const [liveError, setLiveError] = useState(null);
  const [liveTicks, setLiveTicks] = useState([]); // {time, price}
  const dataFetchRef = useRef(null);

  const API_BASE = 'http://localhost:3000/api';

  // Fetch data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, marketsRes, agentsRes, tradesRes, ticksRes] = await Promise.all([
          fetch(`${API_BASE}/simulation/status`).catch(e => {
            console.error('Status fetch failed:', e);
            return { ok: false };
          }),
          fetch(`${API_BASE}/markets`).catch(e => {
            console.error('Markets fetch failed:', e);
            return { ok: false };
          }),
          fetch(`${API_BASE}/leaderboard`).catch(e => {
            console.error('Leaderboard fetch failed:', e);
            return { ok: false };
          }),
          fetch(`${API_BASE}/trades`).catch(e => {
            console.error('Trades fetch failed:', e);
            return { ok: false };
          }),
          fetch(`${API_BASE}/ticks`).catch(e => {
            console.error('Ticks fetch failed:', e);
            return { ok: false };
          }),
        ]);

        if (statusRes.ok) {
          const status = await statusRes.json();
          setIsRunning(status.isRunning);
          setCurrentTick(status.currentTick);
          setTotalTicks(status.totalTicks);
          setError(null);
        }

        if (marketsRes.ok) {
          const marketsData = await marketsRes.json();
          setMarkets(Array.isArray(marketsData) ? marketsData : []);
          if (!activeMarketId && marketsData.length > 0) {
            setActiveMarketId(marketsData[0].marketId);
          }
        }

        if (agentsRes.ok) {
          setAgents(await agentsRes.json());
        }

        if (tradesRes.ok) {
          const tradesData = await tradesRes.json();
          setTrades(Array.isArray(tradesData) ? tradesData : []);
        }

        if (ticksRes.ok) {
          const ticksData = await ticksRes.json();
          setTickData(Array.isArray(ticksData) ? ticksData : []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data from API');
      }
    };

    fetchData();
    dataFetchRef.current = setInterval(fetchData, 1000);

    // live exchange fetcher (CoinPaprika, optional)
    const fetchLive = async () => {
      try {
        const resp = await fetch('http://localhost:3000/api/live/exchanges?quotes=BNB');
        const json = await resp.json();
        setLiveExchanges(Array.isArray(json) ? json : []);
        setLiveError(null);
      } catch (e) {
        console.error('Error fetching live exchanges', e);
        setLiveError(e.message);
      }
    };

    // live price from CoinGecko
    const fetchTicker = async () => {
      try {
        const resp = await fetch('http://localhost:3000/api/gecko/price?ids=binancecoin&vs_currencies=usd');
        const json = await resp.json();
        const price = json?.binancecoin?.usd;
        if (price) {
          setLiveTicks(prev => [...prev, { time: Date.now(), price }].slice(-100));
        }
      } catch (e) {
        console.error('Error fetching gecko price', e);
      }
    };

    fetchLive();
    fetchTicker();
    const liveInterval = setInterval(fetchLive, 30000);
    const tickerInterval = setInterval(fetchTicker, 5000);

    return () => {
      if (dataFetchRef.current) clearInterval(dataFetchRef.current);
      clearInterval(liveInterval);
      clearInterval(tickerInterval);
    };
  }, [activeMarketId]);

  const handleStart = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowDemo(false);
      console.log('Starting simulation...');
      
      const res = await fetch(`${API_BASE}/simulation/start`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        setIsRunning(true);
        setCurrentTick(0);
        setTrades([]);
        setTickData([]);
      } else {
        setError(data.error || 'Failed to start simulation');
      }
    } catch (err) {
      console.error('Error starting simulation:', err);
      setError('Error starting simulation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Resetting simulation...');
      
      setIsRunning(false);
      setCurrentTick(0);
      setTrades([]);
      setTickData([]);
      setMarkets([]);
      setAgents([]);
      setShowDemo(true);
      
      setLoading(false);
    } catch (err) {
      console.error('Error resetting:', err);
      setError('Error resetting simulation');
      setLoading(false);
    }
  };

  const selectedMarket = markets.find(m => m.marketId === activeMarketId) || markets[0];

  return (
    <div className="min-h-screen bg-dark text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
          >
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Agents Playground</h1>
              <p className="text-gray-400 mt-1">Real-time AI trading agent simulation on BNB Chain</p>
            </div>
          </div>
        </motion.div>

        {/* ── Tab Switcher ─────────────────────────────────────────── */}
        <div className="flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('live-arena')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer ${
              activeTab === 'live-arena'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-dark/50 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            <Globe size={16} /> Live Arena
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer ${
              activeTab === 'arena'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-dark/50 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            <Swords size={16} /> Solo Arena
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30'
                : 'bg-dark/50 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            <Zap size={16} /> On-Chain Simulation
          </button>
        </div>

        {/* Error Display */}
        {error && activeTab === 'simulation' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
          >
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* ═════════ LIVE MULTIPLAYER ARENA TAB ════════════════════════════ */}
        {activeTab === 'live-arena' && (
          <motion.div
            key="live-arena-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ArenaLive />
          </motion.div>
        )}

        {/* ═════════ SOLO AI MODEL ARENA TAB ═══════════════════════════════ */}
        {activeTab === 'arena' && (
          <motion.div
            key="arena-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <AgentArena />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            ON-CHAIN SIMULATION TAB
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'simulation' && (<>

        {/* Show Demo or Simulation */}
        {showDemo && !isRunning && currentTick === 0 && (
          <motion.div
            key="demo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <AgentComparisonDemo />
          </motion.div>
        )}

        {/* Simulation Control */}
        <div className="mb-8">
          <SimulationMonitor
            isRunning={isRunning}
            currentTick={currentTick}
            totalTicks={totalTicks}
            onStart={handleStart}
            onReset={handleReset}
          />
        </div>

        {/* Main Grid - Only show when simulation started */}
        {(currentTick > 0 || isRunning || trades.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Markets */}
            <div className="lg:col-span-2 space-y-8">
              {/* Market Charts */}
              {selectedMarket && (
                <MarketChart market={selectedMarket} tickData={tickData} />
              )}

              {/* Market Tabs */}
              {markets.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Markets Overview</h3>
                  {liveError && <p className="text-red-400">Live error: {liveError}</p>}
                  {liveTicks.length > 0 && (
                    <div className="mb-4 glass-panel p-3">
                      <h4 className="font-semibold text-white mb-2">Live BNB Price (CoinGecko)</h4>
                      <LiveTickerChart title="BNB Price (USD)" dataPoints={liveTicks} />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {markets.map((market) => (
                      <motion.button
                        type="button"
                        key={market.marketId}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveMarketId(market.marketId);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          activeMarketId === market.marketId
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                            : 'border-gray-700 bg-dark/30 hover:border-gray-600'
                        }`}
                      >
                        <h4 className="font-semibold text-white truncate text-sm">
                          {market.question.substring(0, 50)}...
                        </h4>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-gray-400">YES: {(market.impliedYesProb * 100).toFixed(1)}%</span>
                          <span className={`text-xs font-semibold ${
                            market.resolved ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {market.resolved ? '✅ Resolved' : '🔴 Active'}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Performance */}
            <div>
              <AgentPerformance agents={agents} trades={trades} />
            </div>
          </div>
        )}

        {/* Trade History */}
        {(currentTick > 0 || isRunning || trades.length > 0) && (
          <div className="mb-8">
            <TradeHistory trades={trades} />
          </div>
        )}

        {/* Stats Footer */}
        {(currentTick > 0 || isRunning || trades.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-primary">{markets.length}</div>
              <p className="text-sm text-gray-400 mt-2">Active Markets</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-blue-400">{agents.length}</div>
              <p className="text-sm text-gray-400 mt-2">Trading Agents</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400">{trades.length}</div>
              <p className="text-sm text-gray-400 mt-2">Total Trades</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400">{currentTick}/{totalTicks}</div>
              <p className="text-sm text-gray-400 mt-2">Simulation Progress</p>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="glass-card p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold">Initializing simulation...</p>
            </div>
          </motion.div>
        )}

        </>)}
        {/* ── end simulation tab ───────────────────────────────────── */}
      </div>
    </div>
  );
};

