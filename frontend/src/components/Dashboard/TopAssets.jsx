import React from 'react';
import { motion } from 'framer-motion';

const MiniSparkline = ({ data, color }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / range) * 100}`).join(' L ');

    return (
        <svg viewBox="0 -10 100 120" preserveAspectRatio="none" className="w-24 h-8 overflow-visible">
            <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export const TopAssets = ({
    title = "Top agents",
    onNavigate,
    items = [
        { name: 'NaiveArb', sub: 'ARB • 102.24', value: '1.2323', change: 2.3, color: '#f0b90b' },
        { name: 'MeanRevert', sub: 'REV • 0.13', value: '23.356', change: -1.43, color: '#ffffff' },
        { name: 'Momentum', sub: 'MOM • 4.22', value: '425.13', change: 23.23, color: '#627eea' },
    ]
}) => {
    return (
        <div className="mt-8">
            <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-xl font-medium text-white">{title}</h2>
                <button onClick={() => onNavigate?.('leaderboard')} className="text-sm text-gray-400 hover:text-white hover:bg-white/5 px-3 py-1 rounded-full transition-colors cursor-pointer">
                    see all
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => onNavigate?.('leaderboard')}
                        className="flex items-center justify-between p-4 glass-panel hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-4 w-1/3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-dark shadow-lg shrink-0 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: item.color }}
                            >
                                {item.name.charAt(0)}
                            </div>
                            <div className="truncate">
                                <h3 className="font-medium text-white truncate">{item.name}</h3>
                                <p className="text-xs text-gray-500 truncate">{item.sub}</p>
                            </div>
                        </div>

                        <div className="text-right w-1/3">
                            <p className="font-medium text-white">{item.value}</p>
                            <p className={`text-xs ${item.change >= 0 ? 'text-primary' : 'text-red-400'}`}>
                                {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change)}%
                            </p>
                        </div>

                        <div className="w-1/3 flex justify-end">
                            <MiniSparkline
                                data={Array.from({ length: 10 }, () => Math.random() * 100 + (item.change > 0 ? 50 : 0))}
                                color={item.change >= 0 ? '#9ffe6a' : '#f87171'}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
