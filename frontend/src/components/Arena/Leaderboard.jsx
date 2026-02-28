import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowUpCircle, ArrowDownCircle, PauseCircle, Crown, Medal } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

/* ====================================================================
   Leaderboard — Global ranking of all arena fighters
   ==================================================================== */
export const Leaderboard = ({ fighters: initialFighters, myWallet }) => {
  const [fighters, setFighters] = useState(initialFighters || []);

  /* keep in sync with parent prop */
  useEffect(() => { setFighters(initialFighters || []); }, [initialFighters]);

  /* Supabase realtime: listen for fighter row changes */
  useEffect(() => {
    const channel = supabase
      .channel('fighters-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fighters' }, () => {
        // When a fighter row changes, parent will re-poll anyway
        // but we could optimistically update here if needed
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const signalIcon = (s) => {
    if (s === 'buy')  return <ArrowUpCircle size={14} className="text-green-400" />;
    if (s === 'sell') return <ArrowDownCircle size={14} className="text-red-400" />;
    return <PauseCircle size={14} className="text-gray-500" />;
  };

  const rankBadge = (i) => {
    if (i === 0) return <Crown size={16} className="text-yellow-400" />;
    if (i === 1) return <Medal size={16} className="text-gray-300" />;
    if (i === 2) return <Medal size={16} className="text-amber-600" />;
    return <span className="text-gray-500 text-xs font-mono w-4 text-center">{i + 1}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-dark/80 rounded-2xl border border-gray-700/50 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-yellow-400" />
        <h3 className="text-lg font-bold">Global Leaderboard</h3>
        <span className="ml-auto text-xs text-gray-500">{fighters.length} fighter{fighters.length !== 1 ? 's' : ''}</span>
      </div>

      {fighters.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No fighters yet — join the arena!</p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence>
            {fighters.map((f, i) => {
              const isMe = myWallet && f.wallet.toLowerCase() === myWallet.toLowerCase();
              return (
                <motion.div
                  key={f.wallet}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition ${
                    isMe
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-gray-800/40 hover:bg-gray-800/60'
                  }`}
                >
                  {/* rank */}
                  <div className="w-6 flex justify-center">{rankBadge(i)}</div>

                  {/* color dot + name */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: f.color || '#8b5cf6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{f.name}</span>
                      {isMe && <span className="text-[10px] text-primary font-bold">(YOU)</span>}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {f.wallet.slice(0, 6)}…{f.wallet.slice(-4)}
                    </span>
                  </div>

                  {/* signal */}
                  <div className="flex items-center gap-1">{signalIcon(f.lastSignal)}</div>

                  {/* P&L */}
                  <div className="text-right min-w-[80px]">
                    <div className={`text-sm font-bold ${f.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {f.pnl >= 0 ? '+' : ''}{f.pnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-400">${f.value.toLocaleString()}</div>
                  </div>

                  {/* trades count */}
                  <div className="text-right min-w-[40px]">
                    <div className="text-xs text-gray-400">{f.tradeCount}</div>
                    <div className="text-[9px] text-gray-500">trades</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
