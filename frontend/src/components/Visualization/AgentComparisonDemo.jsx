import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Zap, Target } from 'lucide-react';

export const AgentComparisonDemo = () => {
  const agents = [
    {
      id: 1,
      name: 'NaiveArbAgent',
      color: '#f0b90b',
      strategy: 'Arbitrage Exploitation',
      description: 'Exploits price discrepancies between market price and true probability',
      trades: '12',
      roi: '+24.3%',
      riskLevel: 'Low',
      features: ['Identifies mispricing', 'Market-neutral', 'High success rate'],
      icon: Target,
    },
    {
      id: 2,
      name: 'MeanRevertAgent',
      color: '#26a17b',
      strategy: 'Mean Reversion',
      description: 'Bets against extreme probability movements, assuming reversion to fair value',
      trades: '18',
      roi: '+15.7%',
      riskLevel: 'Medium',
      features: ['Counter-trend betting', 'Statistical analysis', 'Steady performer'],
      icon: TrendingUp,
    },
    {
      id: 3,
      name: 'MomentumAgent',
      color: '#627eea',
      strategy: 'Momentum Following',
      description: 'Follows trending probabilities and builds positions in trend direction',
      trades: '31',
      roi: '+42.1%',
      riskLevel: 'High',
      features: ['Trend detection', 'High frequency', 'Volatile but profitable'],
      icon: Zap,
    },
  ];

  const sortedAgents = [...agents].sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy size={32} className="text-primary" />
          <h2 className="text-3xl font-bold text-white">Agent Strategies</h2>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Three AI trading agents with different strategies competing in the same prediction markets. 
          Each agent's performance is tracked and displayed in real-time.
        </p>
      </motion.div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {sortedAgents.map((agent, idx) => {
          const IconComponent = agent.icon;
          const medals = ['🥇', '🥈', '🥉'];

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6 relative overflow-hidden group"
            >
              {/* Medal */}
              <div className="absolute top-4 right-4 text-3xl">{medals[idx]}</div>

              {/* Header with icon */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: agent.color }}
                >
                  <IconComponent size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                  <p className="text-xs text-gray-400">{agent.strategy}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-3 bg-dark/30 rounded-lg border border-gray-700">
                  <span className="text-sm text-gray-400">Trades</span>
                  <span className="text-lg font-bold text-white">{agent.trades}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark/30 rounded-lg border border-gray-700">
                  <span className="text-sm text-gray-400">Return</span>
                  <span className={`text-lg font-bold ${
                    parseFloat(agent.roi) > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {agent.roi}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark/30 rounded-lg border border-gray-700">
                  <span className="text-sm text-gray-400">Risk Level</span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    agent.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                    agent.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {agent.riskLevel}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-300 mb-4 italic">{agent.description}</p>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-semibold">Key Features</p>
                {agent.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
                    <span className="text-xs text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundColor: agent.color }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Strategy Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Agent</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Strategy</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Entry Signal</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Risk</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Best For</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-b border-gray-700 hover:bg-dark/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="text-white font-medium">{agent.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-300">{agent.strategy}</td>
                  <td className="py-3 px-4 text-center text-gray-300">
                    {agent.name === 'NaiveArbAgent' && 'Price Mismatch'}
                    {agent.name === 'MeanRevertAgent' && 'Extreme Deviation'}
                    {agent.name === 'MomentumAgent' && 'Trend Confirmation'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      agent.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                      agent.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {agent.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-300">
                    {agent.name === 'NaiveArbAgent' && 'Stable Markets'}
                    {agent.name === 'MeanRevertAgent' && 'Volatile Markets'}
                    {agent.name === 'MomentumAgent' && 'Trending Markets'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Key Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="glass-card p-6 border-l-4 border-primary">
          <h4 className="text-lg font-bold text-white mb-3">Why Multiple Agents?</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✨ Diversified strategies reduce correlation</li>
            <li>✨ Different risk profiles for different markets</li>
            <li>✨ Fault tolerance - if one fails, others continue</li>
            <li>✨ Better market coverage and efficiency</li>
          </ul>
        </div>

        <div className="glass-card p-6 border-l-4 border-blue-400">
          <h4 className="text-lg font-bold text-white mb-3">On-Chain Transparency</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>📊 All trades recorded on-chain (BNB Smart Chain)</li>
            <li>📊 Performance metrics immutable and auditable</li>
            <li>📊 Agents' fund custody verified via smart contracts</li>
            <li>📊 Real-time settlement and execution</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};
