import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Activity } from 'lucide-react';

export const AgentPerformance = ({ agents = [], trades = [] }) => {
  const agentMetrics = useMemo(() => {
    const metrics = agents.map(agent => {
      const agentTrades = trades.filter(t => t.agentId === agent.agentId);
      const buyTrades = agentTrades.filter(t => t.buyYes).length;
      const totalTrades = agentTrades.length;

      return {
        ...agent,
        totalTrades,
        buyTrades,
        buyNoTrades: totalTrades - buyTrades,
        tradeRate: totalTrades > 0 ? ((buyTrades / totalTrades) * 100).toFixed(1) : 0,
      };
    });

    // Sort by total trades
    return metrics.sort((a, b) => b.totalTrades - a.totalTrades);
  }, [agents, trades]);

  if (agentMetrics.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-gray-400 h-80 flex flex-col items-center justify-center">
        <Activity size={48} className="mb-4 opacity-50" />
        <p>No agent data yet</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-primary" />
        <div>
          <h3 className="text-lg font-bold text-white">Agent Performance</h3>
          <p className="text-sm text-gray-400">Trading statistics by agent</p>
        </div>
      </div>

      <div className="space-y-4">
        {agentMetrics.map((agent, idx) => {
          const colors = ['#f0b90b', '#26a17b', '#627eea', '#ec4899', '#8b5cf6'];
          const color = colors[idx % colors.length];

          return (
            <motion.div
              key={agent.agentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 bg-dark/30 border border-gray-700 rounded-lg hover:bg-dark/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: color }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{agent.name || 'Agent'}</h4>
                    <p className="text-xs text-gray-400">
                      {agent.address ? `${agent.address.slice(0, 6)}...${agent.address.slice(-4)}` : 'ID: ' + agent.agentId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{agent.totalTrades}</div>
                  <p className="text-xs text-gray-400">Total Trades</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-dark/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-green-400">{agent.buyTrades}</div>
                  <p className="text-xs text-gray-400">BUY YES</p>
                </div>
                <div className="bg-dark/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-red-400">{agent.buyNoTrades}</div>
                  <p className="text-xs text-gray-400">BUY NO</p>
                </div>
                <div className="bg-dark/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-yellow-400">{agent.tradeRate}%</div>
                  <p className="text-xs text-gray-400">YES Ratio</p>
                </div>
              </div>

              {/* Performance bar */}
              <div className="w-full h-2 bg-dark/50 rounded-full overflow-hidden border border-gray-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((agent.totalTrades / Math.max(...agentMetrics.map(a => a.totalTrades))) * 100, 100)}%` }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.6 }}
                  style={{ backgroundColor: color }}
                  className="h-full rounded-full"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-primary">Total Agents:</span> {agentMetrics.length} •
          <span className="font-semibold text-primary ml-2">Combined Trades:</span> {trades.length}
        </p>
      </div>
    </motion.div>
  );
};
