import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

export const PortfolioSummary = ({ balance = '98,230.02', change = '+245.24', percent = '0.23%' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 relative overflow-hidden h-64 flex flex-col justify-between group"
        >
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Portfolio summary</h2>
                    <p className="text-sm text-gray-400">Current balance (USDT)</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                    <MoreVertical size={18} />
                </button>
            </div>

            <div className="z-10 relative mt-4">
                <h1 className="text-5xl font-medium text-white tracking-tight mb-2 flex items-baseline gap-1">
                    <span className="text-3xl text-gray-400">$</span>
                    {balance.split('.')[0]}
                    <span className="text-3xl text-gray-400">.{balance.split('.')[1]}</span>
                </h1>
                <div className="flex items-center gap-3 text-sm font-medium">
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                        ▲ {percent} (1d)
                    </span>
                    <span className="text-gray-300">{change}</span>
                </div>
            </div>

            {/* Synthetic Chart Background */}
            <div className="absolute bottom-0 right-0 w-2/3 h-full opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_0_15px_rgba(159,254,106,0.3)]">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9ffe6a" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#9ffe6a" stopOpacity="0" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <path
                        d="M0,150 C50,140 80,110 120,120 C160,130 180,90 220,100 C260,110 290,70 330,80 C360,90 380,50 400,60 L400,200 L0,200 Z"
                        fill="url(#chartGradient)"
                    />
                    <path
                        d="M0,150 C50,140 80,110 120,120 C160,130 180,90 220,100 C260,110 290,70 330,80 C360,90 380,50 400,60"
                        fill="none"
                        stroke="#9ffe6a"
                        strokeWidth="3"
                        filter="url(#glow)"
                    />
                    <circle cx="400" cy="60" r="6" fill="#9ffe6a" filter="url(#glow)" className="animate-pulse" />
                </svg>
            </div>
        </motion.div>
    );
};
