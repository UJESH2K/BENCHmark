import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpCircle, ArrowDownCircle, PauseCircle,
  TrendingUp, TrendingDown, Minus, DollarSign, Coins,
} from 'lucide-react';

/* ====================================================================
   FighterCards — visual breakdown of each fighter's position & signals
   ==================================================================== */
export const FighterCards = ({ fighters }) => {
  if (!fighters?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {fighters.map((f, i) => (
        <FighterCard key={f.wallet} fighter={f} rank={i + 1} />
      ))}
    </div>
  );
};

const FighterCard = ({ fighter: f, rank }) => {
  const pnlColor = f.pnl >= 0 ? 'text-green-400' : 'text-red-400';
  const pnlBg    = f.pnl >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';

  // Position bar: how much is in BNB vs cash
  const totalValue = Math.max(f.value, 1);
  const bnbExposure = f.exposure || 0;
  const cashPct = Math.max(0, Math.min(100, (f.cash / totalValue) * 100));
  const bnbPct  = 100 - cashPct;

  // Signal dot colors
  const signalColor = (s) => {
    if (s === 'buy')  return 'bg-green-400';
    if (s === 'sell') return 'bg-red-400';
    return 'bg-gray-600';
  };

  // Current signal big indicator
  const SignalBadge = () => {
    if (f.lastSignal === 'buy') return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
        <ArrowUpCircle size={14} className="text-green-400" />
        <span className="text-green-400 text-xs font-bold uppercase">Buying</span>
      </div>
    );
    if (f.lastSignal === 'sell') return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
        <ArrowDownCircle size={14} className="text-red-400" />
        <span className="text-red-400 text-xs font-bold uppercase">{f.isShort ? 'Shorting' : 'Selling'}</span>
      </div>
    );
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-700/40 border border-gray-600/30">
        <PauseCircle size={14} className="text-gray-400" />
        <span className="text-gray-400 text-xs font-bold uppercase">Holding</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/60 rounded-2xl border border-gray-700/40 p-4 hover:border-gray-600/60 transition"
    >
      {/* header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
             style={{ backgroundColor: (f.color || '#8b5cf6') + '30', color: f.color || '#8b5cf6' }}>
          #{rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: f.color || '#8b5cf6' }}>
            {f.name}
          </div>
          <div className="text-[10px] text-gray-500 font-mono">{f.wallet.slice(0, 8)}…{f.wallet.slice(-4)}</div>
        </div>
        <SignalBadge />
      </div>

      {/* P&L banner */}
      <div className={`rounded-xl p-3 mb-3 border ${pnlBg}`}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Portfolio</span>
          <span className="text-white font-bold text-lg">${f.value.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-400 text-xs">P&L</span>
          <span className={`font-bold text-sm ${pnlColor}`}>
            {f.pnl >= 0 ? '+' : ''}{f.pnl.toFixed(2)} ({f.pnlPct >= 0 ? '+' : ''}{f.pnlPct}%)
          </span>
        </div>
      </div>

      {/* Position bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span className="flex items-center gap-1"><DollarSign size={10} /> Cash: ${f.cash.toLocaleString()}</span>
          <span className="flex items-center gap-1">
            <Coins size={10} /> BNB: {f.bnb.toFixed(4)} {f.isShort && <span className="text-red-400">(SHORT)</span>}
          </span>
        </div>
        <div className="h-3 rounded-full bg-gray-800 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
            style={{ width: `${cashPct}%` }}
          />
          <div
            className={`h-full transition-all duration-500 ${f.isShort ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-yellow-500 to-yellow-400'}`}
            style={{ width: `${bnbPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] mt-0.5">
          <span className="text-blue-400">Cash {cashPct.toFixed(0)}%</span>
          <span className={f.isShort ? 'text-red-400' : 'text-yellow-400'}>
            BNB {bnbPct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Trade stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center bg-green-500/10 rounded-lg py-1.5">
          <div className="text-green-400 font-bold text-sm">{f.totalBuys}</div>
          <div className="text-[9px] text-gray-500">Buys</div>
        </div>
        <div className="text-center bg-red-500/10 rounded-lg py-1.5">
          <div className="text-red-400 font-bold text-sm">{f.totalSells}</div>
          <div className="text-[9px] text-gray-500">Sells</div>
        </div>
        <div className="text-center bg-gray-700/30 rounded-lg py-1.5">
          <div className="text-gray-400 font-bold text-sm">{f.totalHolds}</div>
          <div className="text-[9px] text-gray-500">Holds</div>
        </div>
      </div>

      {/* Signal history (last 30 as colored dots) */}
      {f.signalHistory?.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 mb-1">Signal History</div>
          <div className="flex gap-[3px] flex-wrap">
            {f.signalHistory.map((s, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-sm ${signalColor(s)} transition-all`}
                title={`Tick ${i + 1}: ${s}`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
