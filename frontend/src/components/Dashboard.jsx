import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export function MarketCard({ market, index }) {
  if (!market) return null;

  const yesPct = (market.impliedYesProb * 100).toFixed(1);
  const noPct = (100 - market.impliedYesProb * 100).toFixed(1);
  const isResolved = market.resolved;

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { delay: index * 0.1 } },
  };

  return (
    <motion.div
      className="market-card relative overflow-hidden group"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-gold transition-colors">
          {market.question}
        </h3>

        <div className="space-y-3">
          {/* Probability Display */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-400 font-semibold">YES {yesPct}%</span>
              <span className="text-red-400 font-semibold">NO {noPct}%</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-700">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-green-400"
                style={{ width: `${yesPct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${yesPct}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="bg-gradient-to-r from-red-500 to-red-400"
                animate={{ width: `${noPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-gray-400">
            <span>Volume: {market.totalVolume?.toFixed(2) || '0'} BNB</span>
            <span className={isResolved ? 'text-green-400 font-semibold' : 'text-yellow-400'}>
              {isResolved ? '✅ Resolved' : '🔴 Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-300" />
    </motion.div>
  );
}

export function LeaderboardTable({ agents }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-gray-400">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        No agents data yet
      </div>
    );
  }

  const rowVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="px-6 py-4 text-left text-gold font-bold">Rank</th>
              <th className="px-6 py-4 text-left text-gold font-bold">Agent</th>
              <th className="px-6 py-4 text-left text-gold font-bold">Trades</th>
              <th className="px-6 py-4 text-left text-gold font-bold">Address</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, idx) => (
              <motion.tr
                key={agent.agentId}
                className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5 transition-colors"
                variants={rowVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: idx * 0.05 }}
              >
                <td className="px-6 py-4">
                  <motion.span
                    className="text-gold font-bold text-lg"
                    whileHover={{ scale: 1.2 }}
                  >
                    #{idx + 1}
                  </motion.span>
                </td>
                <td className="px-6 py-4 font-semibold">{agent.name}</td>
                <td className="px-6 py-4">
                  <motion.span
                    className="flex items-center gap-2 text-green-400 font-semibold"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {agent.totalTrades}
                  </motion.span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                  {agent.address?.slice(0, 6)}...{agent.address?.slice(-4)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SimulationStatus({ status, currentTick, totalTicks }) {
  const progress = totalTicks > 0 ? (currentTick / totalTicks) * 100 : 0;
  const isRunning = status === 'running';
  const isCompleted = status === 'completed';

  return (
    <motion.div
      className="glass-card p-6 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-400 mb-1">Status</h3>
          <motion.p
            className={`text-2xl font-bold ${isRunning ? 'text-yellow-400' : isCompleted ? 'text-green-400' : 'text-gray-400'}`}
            key={status}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </motion.p>
        </div>
        <div className="text-right">
          <h3 className="text-sm text-gray-400 mb-1">Progress</h3>
          <p className="text-2xl font-bold text-gold">{currentTick} / {totalTicks}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {isRunning && (
        <motion.div
          className="flex items-center gap-2 text-yellow-400 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          Simulation running...
        </motion.div>
      )}
    </motion.div>
  );
}
