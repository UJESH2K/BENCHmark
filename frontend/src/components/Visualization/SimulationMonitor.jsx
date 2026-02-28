import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCw, Zap } from 'lucide-react';

export const SimulationMonitor = ({ isRunning, currentTick, totalTicks, onStart, onReset }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const progress = totalTicks > 0 ? (currentTick / totalTicks) * 100 : 0;
  const estimatedTimeRemaining = isRunning ? Math.ceil((totalTicks - currentTick) * 5) : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          <div>
            <h3 className="text-lg font-bold text-white">Simulation Control</h3>
            <p className="text-sm text-gray-400">
              {isRunning ? 'Running...' : 'Ready to start'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              onStart();
            }}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              isRunning
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-dark hover:bg-primary/90 shadow-lg hover:shadow-xl'
            }`}
          >
            <Play size={16} />
            Start
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              onReset();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all cursor-pointer"
          >
            <RotateCw size={16} />
            Reset
          </motion.button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-white">
            Tick {currentTick} / {totalTicks}
          </span>
          <span className="text-sm font-semibold text-primary">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-dark/50 rounded-full overflow-hidden border border-gray-700">
          <motion.div
            layout
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark/30 border border-gray-700 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap size={18} className="text-primary" />
            <div className="text-2xl font-bold text-white">{currentTick}</div>
          </div>
          <p className="text-xs text-gray-400">Active Tick</p>
        </div>

        <div className="bg-dark/30 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{formatTime(timeElapsed)}</div>
          <p className="text-xs text-gray-400">Elapsed Time</p>
        </div>

        <div className="bg-dark/30 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{estimatedTimeRemaining}s</div>
          <p className="text-xs text-gray-400">Est. Remaining</p>
        </div>
      </div>

      {/* Status Message */}
      {isRunning && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 p-3 bg-primary/10 border border-primary/30 rounded-lg text-center"
        >
          <p className="text-sm text-primary font-semibold">
            Agents are executing trades live on-chain... 🚀
          </p>
        </motion.div>
      )}

      {currentTick === totalTicks && currentTick > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center"
        >
          <p className="text-sm text-green-400 font-semibold">
            ✅ Simulation complete! Review results below.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
