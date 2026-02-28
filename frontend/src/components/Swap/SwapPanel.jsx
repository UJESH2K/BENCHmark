import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronDown, Repeat, ArrowUpRight } from 'lucide-react';

export const SwapPanel = () => {
    const [amount, setAmount] = useState('');

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel w-96 flex-shrink-0 flex flex-col h-full bg-[#0a140f] border-l border-white/5 p-6"
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-medium text-white">Swap</h2>
                <button type="button" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-2 relative">
                {/* FROM BOX */}
                <div className="bg-[#12231a] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between text-xs text-gray-400 mb-3 font-medium tracking-wide">
                        <span>FROM:</span>
                        <div className="flex items-center gap-2 bg-dark/50 px-3 py-1.5 rounded-full border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="w-4 h-4 rounded-full bg-[#f0b90b] flex items-center justify-center text-[8px] text-dark font-bold">B</div>
                            <span className="text-white">0x245...23</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-500">Available:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300">23,234.23</span>
                            <button type="button" onClick={(e) => e.preventDefault()} className="text-gray-400 hover:text-primary transition-colors cursor-pointer">MAX</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <button type="button" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl transition-colors cursor-pointer">
                            <div className="w-6 h-6 rounded-full bg-[#f0b90b] flex items-center justify-center text-xs text-dark font-bold">B</div>
                            <span className="text-lg font-medium text-white">BNB</span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>
                        <div className="text-right">
                            <input
                                type="text"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent text-right text-3xl font-medium text-white w-32 focus:outline-none placeholder-gray-600"
                            />
                            <p className="text-xs text-gray-500">~$0.00</p>
                        </div>
                    </div>
                </div>

                {/* SWAP ICON MIDDLE */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#12231a] border-4 border-[#0a140f] flex items-center justify-center text-primary cursor-pointer hover:scale-110 transition-transform">
                    <Repeat size={16} />
                </div>

                {/* TO BOX */}
                <div className="bg-[#12231a] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between text-xs text-gray-400 mb-3 font-medium tracking-wide">
                        <span>TO:</span>
                        <div className="flex items-center gap-2 bg-dark/50 px-3 py-1.5 rounded-full border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="w-4 h-4 rounded-full bg-[#26a17b] flex items-center justify-center text-[8px] text-white font-bold">T</div>
                            <span className="text-white">0x245...23</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-500">You receive:</span>
                        <span className="text-xs text-gray-300 font-medium">0.00</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <button type="button" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl transition-colors cursor-pointer">
                            <div className="w-6 h-6 rounded-full bg-[#26a17b] flex items-center justify-center text-xs text-white font-bold">T</div>
                            <span className="text-lg font-medium text-white">USDT</span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>
                        <div className="text-right">
                            <span className="text-3xl font-medium text-white">0.00</span>
                            <p className="text-xs text-gray-500">~$0.00</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-4 px-2 tracking-wide font-medium">
                    <span>1 BNB = 600 USDT</span>
                    <span>FEE: $0.31</span>
                </div>
                <button type="button" onClick={(e) => e.preventDefault()} className="w-full bg-primary hover:bg-primaryDark text-dark text-lg font-bold py-4 rounded-2xl flex items-center justify-between px-6 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(159,254,106,0.2)] cursor-pointer">
                    <span>Confirm Swap</span>
                    <ArrowUpRight size={24} />
                </button>
            </div>

        </motion.div>
    );
};
