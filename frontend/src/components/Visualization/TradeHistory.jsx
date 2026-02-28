import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export const TradeHistory = ({ trades = [] }) => {
  const groupedTrades = useMemo(() => {
    const grouped = {};
    trades.forEach(trade => {
      const agentName = trade.agentName || 'Unknown';
      if (!grouped[agentName]) {
        grouped[agentName] = [];
      }
      grouped[agentName].push(trade);
    });
    return grouped;
  }, [trades]);

  const totalTrades = trades.length;
  const buyTrades = trades.filter(t => t.buyYes).length;
  const sellTrades = trades.filter(t => !t.buyYes).length;

  if (trades.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-gray-400 h-80 flex flex-col items-center justify-center">
        <BarChart3 size={48} className="mb-4 opacity-50" />
        <p>No trades executed yet</p>
        <p className="text-sm mt-2 text-gray-500">Start the simulation to see trades</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Trade History</h3>
          <p className="text-sm text-gray-400">All executed trades from agents</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 font-semibold">
            {buyTrades} Buys
          </div>
          <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 font-semibold">
            {sellTrades} Sells
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-dark/50 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalTrades}</div>
          <p className="text-xs text-gray-400 mt-1">Total Trades</p>
        </div>
        <div className="bg-dark/50 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{buyTrades}</div>
          <p className="text-xs text-gray-400 mt-1">BUY YES</p>
        </div>
        <div className="bg-dark/50 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{sellTrades}</div>
          <p className="text-xs text-gray-400 mt-1">BUY NO</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {trades.slice().reverse().map((trade, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.02 }}
            className="flex items-center justify-between p-3 bg-dark/30 border border-gray-700 rounded-lg hover:bg-dark/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {trade.buyYes ? (
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                  <ArrowUpRight size={16} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                  <ArrowDownLeft size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{trade.agentName}</p>
                <p className="text-xs text-gray-400 truncate">
                  Market #{trade.marketId} • {trade.buyYes ? 'BUY YES' : 'BUY NO'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{(trade.amount || 0).toFixed(2)} BNB</p>
              <p className="text-xs text-gray-400">Tick {trade.tick}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
