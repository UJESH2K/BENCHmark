import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

/* ====================================================================
   TradeStream — live scrolling feed of all arena trades
   ==================================================================== */
export const TradeStream = ({ trades: initialTrades }) => {
  const [trades, setTrades] = useState(initialTrades || []);
  const listRef = useRef(null);

  useEffect(() => { setTrades(initialTrades || []); }, [initialTrades]);

  /* Supabase realtime: new trades appear instantly */
  useEffect(() => {
    const channel = supabase
      .channel('trades-insert')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trades' },
        (payload) => {
          const row = payload.new;
          setTrades(prev => [{
            tick: row.tick,
            wallet: row.wallet,
            model: row.model_name,
            type: row.trade_type,
            price: row.price,
            amount: row.amount,
            confidence: row.confidence,
            ts: new Date(row.created_at).getTime(),
          }, ...prev].slice(0, 100));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /* auto-scroll to top on new trade */
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [trades.length]);

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-dark/80 rounded-2xl border border-gray-700/50 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-blue-400" />
        <h3 className="text-lg font-bold">Live Trade Stream</h3>
        <span className="ml-auto text-xs text-gray-500">{trades.length} recent</span>
      </div>

      {trades.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No trades yet…</p>
      ) : (
        <div ref={listRef} className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence initial={false}>
            {trades.map((t, i) => (
              <motion.div
                key={`${t.wallet}-${t.tick}-${t.type}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition"
              >
                {t.type === 'buy'
                  ? <ArrowUpCircle size={14} className="text-green-400 flex-shrink-0" />
                  : <ArrowDownCircle size={14} className="text-red-400 flex-shrink-0" />}

                <span className={`text-xs font-bold uppercase ${t.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type}
                </span>

                <span className="text-xs text-gray-300 truncate max-w-[100px]">{t.model || 'Agent'}</span>

                <span className="text-[10px] text-gray-500 font-mono">
                  {t.wallet?.slice(0, 6)}…
                </span>

                <div className="ml-auto text-right">
                  <div className="text-xs text-gray-200">{t.amount?.toFixed(4)} BNB</div>
                  <div className="text-[10px] text-gray-500">@ ${t.price?.toFixed(2)}</div>
                </div>

                <span className="text-[9px] text-gray-600 min-w-[45px] text-right">
                  {timeAgo(t.ts)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
