import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Trophy, Swords, Upload, Wallet, LogOut,
  ArrowUpCircle, ArrowDownCircle, PauseCircle,
  Activity, Users, Zap, TrendingUp, TrendingDown,
  Maximize2, Minimize2, X,
} from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { Leaderboard } from './Leaderboard';
import { TradeStream } from './TradeStream';
import { ArenaPortfolioChart } from './ArenaPortfolioChart';
import { FighterCards } from './FighterCards';
import { validateModel } from '../../lib/mlInference';

const API = (import.meta.env.VITE_API_URL || '') + '/api';

/* ====================================================================
   ArenaLive — Multiplayer model marketplace / arena
   ==================================================================== */
export const ArenaLive = () => {
  const { account, isConnected, connectWallet } = useWeb3();

  /* ── remote state (polled from backend) ───────────────────────── */
  const [status, setStatus]           = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [trades, setTrades]           = useState([]);
  const [portfolios, setPortfolios]   = useState({});

  /* ── local state ──────────────────────────────────────────────── */
  const [joined, setJoined]           = useState(false);
  const [modelFile, setModelFile]     = useState(null);
  const [modelError, setModelError]   = useState(null);
  const [agentName, setAgentName]     = useState('');
  const [joining, setJoining]         = useState(false);
  const [leaving, setLeaving]         = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab]     = useState('fighters'); // 'fighters' | 'leaderboard' | 'trades'
  const intervalRef                    = useRef(null);
  const containerRef                   = useRef(null);

  /* ── fullscreen toggle ────────────────────────────────────────── */
  const toggleFullscreen = () => setIsFullscreen(v => !v);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  // prevent body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  /* ── poll backend every 3 s ───────────────────────────────────── */
  const poll = useCallback(async () => {
    try {
      const [sRes, lbRes, tRes, pRes] = await Promise.all([
        fetch(`${API}/arena/status`).catch(() => null),
        fetch(`${API}/arena/leaderboard`).catch(() => null),
        fetch(`${API}/arena/trades?limit=100`).catch(() => null),
        fetch(`${API}/arena/portfolios`).catch(() => null),
      ]);
      if (sRes?.ok)  setStatus(await sRes.json());
      if (lbRes?.ok) setLeaderboard(await lbRes.json());
      if (tRes?.ok)  setTrades(await tRes.json());
      if (pRes?.ok)  setPortfolios(await pRes.json());
    } catch { /* network hiccup */ }
  }, []);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current);
  }, [poll]);

  /* check if current wallet is already in the leaderboard */
  useEffect(() => {
    if (account && leaderboard.length) {
      const found = leaderboard.find(
        f => f.wallet.toLowerCase() === account.toLowerCase()
      );
      setJoined(!!found);
    } else {
      setJoined(false);
    }
  }, [account, leaderboard]);

  /* ── file upload handler ──────────────────────────────────────── */
  const handleFile = (e) => {
    setModelError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const model = JSON.parse(ev.target.result);
        const check = validateModel(model);
        if (!check.valid) { setModelError(check.error); return; }
        if (!model.name) model.name = file.name.replace('.json', '');
        setModelFile(model);
      } catch { setModelError('Invalid JSON'); }
    };
    reader.readAsText(file);
  };

  /* ── join arena ───────────────────────────────────────────────── */
  const handleJoin = async () => {
    if (!account || !modelFile) return;
    setJoining(true);
    // Override model name with user-entered name (or keep model's own name)
    const payload = { ...modelFile };
    if (agentName.trim()) payload.name = agentName.trim();
    try {
      const res = await fetch(`${API}/arena/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: account, model: payload }),
      });
      const data = await res.json();
      if (!res.ok) { setModelError(data.error); return; }
      setJoined(true);
      poll();
    } catch (err) { setModelError(err.message); }
    finally { setJoining(false); }
  };

  /* ── leave arena ──────────────────────────────────────────────── */
  const handleLeave = async () => {
    if (!account) return;
    setLeaving(true);
    try {
      await fetch(`${API}/arena/leave/${account}`, { method: 'DELETE' });
      setJoined(false);
      setModelFile(null);
      setAgentName('');
      poll();
    } catch { /* ignore */ }
    finally { setLeaving(false); }
  };

  /* ── helper: load one of the sample models ────────────────────── */
  const loadSample = async (n) => {
    try {
      setModelError(null);
      const res = await fetch(`/sample-models/model${n}.json`);
      const model = await res.json();
      if (!model.name) model.name = `Sample Model ${n}`;
      setModelFile(model);
    } catch { setModelError('Failed to load sample model'); }
  };

  /* ── tab button helper ────────────────────────────────────────── */
  const TabBtn = ({ id, icon: Icon, label, count }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
        activeTab === id
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon size={13} />
      {label}
      {count !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-800 text-[10px]">{count}</span>
      )}
    </button>
  );

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-[#0a0a1a] overflow-y-auto p-4 md:p-6'
    : 'space-y-6';

  return (
    <div ref={containerRef} className={containerClass}>
      {/* ── live arena header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Globe size={22} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Live Multiplayer Arena</h2>
            <p className="text-gray-400 text-sm">
              {status
                ? `Tick #${status.tickCount} · ${leaderboard.length} fighter${leaderboard.length !== 1 ? 's' : ''} · BNB $${status.currentPrice?.toFixed(2) ?? '—'}`
                : 'Connecting…'}
            </p>
          </div>
          {status?.running && (
            <span className="ml-2 relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          )}
        </div>

        {/* fullscreen toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 hover:border-primary/40 text-gray-400 hover:text-white transition cursor-pointer text-sm"
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* ── join / leave card ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-dark/80 rounded-2xl border border-gray-700/50 p-6 mb-6"
      >
        {!isConnected ? (
          <div className="text-center py-8">
            <Wallet size={40} className="mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 mb-4 text-sm">MetaMask required to join the arena</p>
            <button
              type="button"
              onClick={connectWallet}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-yellow-400 text-black rounded-xl font-bold cursor-pointer hover:opacity-90 transition"
            >
              Connect MetaMask
            </button>
          </div>
        ) : !joined ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Swords size={20} className="text-purple-400" />
              <h3 className="text-lg font-semibold">Enter the Arena</h3>
              <span className="ml-auto text-xs text-gray-500 font-mono">{account?.slice(0, 6)}…{account?.slice(-4)}</span>
            </div>

            {/* Agent name input */}
            <div className="mb-3">
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Agent name (e.g. Alpha Sniper)"
                maxLength={24}
                className="w-full sm:w-64 px-4 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/60 transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-600 hover:border-primary/60 transition text-sm text-gray-300">
                <Upload size={16} />
                {modelFile ? modelFile.name : 'Upload Model Weights (.json)'}
                <input type="file" accept=".json" onChange={handleFile} className="hidden" />
              </label>
              <span className="text-gray-500 text-xs">or</span>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button
                    type="button" key={n}
                    onClick={() => loadSample(n)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 hover:border-primary/40 cursor-pointer transition"
                  >
                    Sample {n}
                  </button>
                ))}
              </div>
            </div>
            {modelFile && (
              <p className="text-green-400 text-xs mb-2">✓ <strong>{modelFile.name}</strong> loaded — {modelFile.layers?.length ?? '?'} layers</p>
            )}
            {modelError && <p className="text-red-400 text-xs mb-2">{modelError}</p>}

            <button
              type="button"
              disabled={!modelFile || joining}
              onClick={handleJoin}
              className="mt-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {joining ? 'Joining…' : '⚔️ Join Arena'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 font-semibold text-sm">
                You are in the arena!
              </span>
              <span className="text-gray-500 text-xs font-mono">{account?.slice(0, 6)}…{account?.slice(-4)}</span>
            </div>
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 cursor-pointer transition text-sm"
            >
              <LogOut size={14} /> {leaving ? 'Leaving…' : 'Leave Arena'}
            </button>
          </div>
        )}
      </motion.div>

      {/* ── tabs: Fighters / Leaderboard / Trades ─────────────────── */}
      <div className="flex gap-2 mb-4">
        <TabBtn id="fighters"    icon={Swords}  label="Fighters"    count={leaderboard.length} />
        <TabBtn id="leaderboard" icon={Trophy}   label="Leaderboard" />
        <TabBtn id="trades"      icon={Activity} label="Trade Feed"  count={trades.length} />
      </div>

      {/* ── tab content ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'fighters' && (
          <motion.div key="fighters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FighterCards fighters={leaderboard} />
          </motion.div>
        )}
        {activeTab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Leaderboard fighters={leaderboard} myWallet={account} />
          </motion.div>
        )}
        {activeTab === 'trades' && (
          <motion.div key="trades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TradeStream trades={trades} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── portfolio chart (always visible) ──────────────────────── */}
      {Object.keys(portfolios).length > 0 && (
        <div className="mt-6">
          <ArenaPortfolioChart
            portfolios={portfolios}
            priceHistory={status?.priceHistory || []}
            fullscreen={isFullscreen}
          />
        </div>
      )}
    </div>
  );
};
