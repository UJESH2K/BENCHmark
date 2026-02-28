import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const MarketChart = ({ market, tickData }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (tickData && tickData.length > 0) {
      const marketHistory = tickData.map(tick => {
        const m = tick.markets?.find(mt => mt.marketId === market.marketId);
        return {
          tick: tick.tick,
          probability: m ? m.impliedYesProb * 100 : 0,
          trueProb: m ? m.trueProbability * 100 : 0,
        };
      });
      setChartData(marketHistory);
    }
  }, [tickData, market]);

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6 h-80 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
          <p>Waiting for market data...</p>
        </div>
      </div>
    );
  }

  const maxProb = 100;
  const minProb = 0;
  const width = chartData.length > 1 ? 100 / (chartData.length - 1) : 0;

  const createPath = (dataKey) => {
    const points = chartData.map((d, i) => {
      const x = i * width;
      const y = ((maxProb - d[dataKey]) / (maxProb - minProb)) * 100;
      return `${x},${y}`;
    }).join(' L ');
    return `M ${points}`;
  };

  const yesPathD = createPath('probability');
  const truePathD = createPath('trueProb');

  const currentProb = chartData[chartData.length - 1]?.probability || 0;
  const trueProbNow = chartData[chartData.length - 1]?.trueProb || 0;
  const prevProb = chartData[chartData.length - 2]?.probability || currentProb;
  const probChange = currentProb - prevProb;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
            {market.question}
          </h3>
          <p className="text-sm text-gray-400">Implied Probability Over Time</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{currentProb.toFixed(1)}%</div>
          <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${
            probChange >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {probChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(probChange).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="relative h-64 bg-dark/50 rounded-lg p-4 border border-gray-700">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="impliedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0b90b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f0b90b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#627eea" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#627eea" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="#444" strokeWidth="0.5" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="#444" strokeWidth="0.3" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#444" strokeWidth="0.3" />

          {/* True probability area */}
          <path
            d={`${truePathD} L 100,100 L 0,100 Z`}
            fill="url(#trueGradient)"
          />

          {/* Implied probability area */}
          <path
            d={`${yesPathD} L 100,100 L 0,100 Z`}
            fill="url(#impliedGradient)"
          />

          {/* True probability line */}
          <path
            d={truePathD}
            fill="none"
            stroke="#627eea"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Implied probability line (thick) */}
          <path
            d={yesPathD}
            fill="none"
            stroke="#f0b90b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f0b90b]" />
          <span className="text-gray-300">Implied YES: {currentProb.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#627eea]" />
          <span className="text-gray-300">True Prob: {trueProbNow.toFixed(1)}%</span>
        </div>
      </div>
    </motion.div>
  );
};
