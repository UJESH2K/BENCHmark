import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Repeat, ArrowUpRight, Check } from 'lucide-react';

const TOKENS = [
    { symbol: 'BNB', color: '#f0b90b', textColor: 'text-dark' },
    { symbol: 'USDT', color: '#26a17b', textColor: 'text-white' },
    { symbol: 'ETH', color: '#627eea', textColor: 'text-white' },
];

export const SwapPanel = () => {
    const [amount, setAmount] = useState('');
    const [fromToken, setFromToken] = useState(TOKENS[0]);
    const [toToken, setToToken] = useState(TOKENS[1]);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [visible, setVisible] = useState(true);

    const AVAILABLE = '23,234.23';
    const rate = 600;
    const numAmount = parseFloat(amount) || 0;
    const receiveAmount = (numAmount * rate).toFixed(2);
    const dollarValue = (numAmount * rate).toFixed(2);

    const handleConfirm = () => {
        if (!numAmount) return;
        setConfirmed(true);
        setTimeout(() => setConfirmed(false), 2500);
    };

    const swapTokens = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
    };

    if (!visible) {
        return (
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setVisible(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-dark flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 cursor-pointer"
                title="Open Swap"
            >
                <Repeat size={22} />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel w-96 flex-shrink-0 flex flex-col h-full bg-[#0a140f] border-l border-white/5 p-6"
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-medium text-white">Swap</h2>
                <button type="button" onClick={() => setVisible(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
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
                            <span className="text-gray-300">{AVAILABLE}</span>
                            <button type="button" onClick={() => setAmount(AVAILABLE.replace(/,/g, ''))} className="text-gray-400 hover:text-primary transition-colors cursor-pointer">MAX</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="relative">
                        <button type="button" onClick={() => setShowFromPicker(!showFromPicker)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl transition-colors cursor-pointer">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{backgroundColor: fromToken.color}}><span className={fromToken.textColor}>{fromToken.symbol[0]}</span></div>
                            <span className="text-lg font-medium text-white">{fromToken.symbol}</span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>
                        <AnimatePresence>
                            {showFromPicker && (
                                <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} className="absolute left-0 top-12 bg-[#12231a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden min-w-[120px]">
                                    {TOKENS.filter(t => t.symbol !== toToken.symbol).map(t => (
                                        <button key={t.symbol} onClick={() => {setFromToken(t);setShowFromPicker(false);}} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{backgroundColor:t.color}}><span className={t.textColor}>{t.symbol[0]}</span></div>
                                            {t.symbol}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        </div>
                        <div className="text-right">
                            <input
                                type="text"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent text-right text-3xl font-medium text-white w-32 focus:outline-none placeholder-gray-600"
                            />
                            <p className="text-xs text-gray-500">~${dollarValue}</p>
                        </div>
                    </div>
                </div>

                {/* SWAP ICON MIDDLE */}
                <div onClick={swapTokens} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#12231a] border-4 border-[#0a140f] flex items-center justify-center text-primary cursor-pointer hover:scale-110 transition-transform">
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
                        <span className="text-xs text-gray-300 font-medium">{receiveAmount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="relative">
                        <button type="button" onClick={() => setShowToPicker(!showToPicker)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl transition-colors cursor-pointer">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{backgroundColor: toToken.color}}><span className={toToken.textColor}>{toToken.symbol[0]}</span></div>
                            <span className="text-lg font-medium text-white">{toToken.symbol}</span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>
                        <AnimatePresence>
                            {showToPicker && (
                                <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} className="absolute left-0 top-12 bg-[#12231a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden min-w-[120px]">
                                    {TOKENS.filter(t => t.symbol !== fromToken.symbol).map(t => (
                                        <button key={t.symbol} onClick={() => {setToToken(t);setShowToPicker(false);}} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{backgroundColor:t.color}}><span className={t.textColor}>{t.symbol[0]}</span></div>
                                            {t.symbol}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-medium text-white">{receiveAmount}</span>
                            <p className="text-xs text-gray-500">~${receiveAmount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-4 px-2 tracking-wide font-medium">
                    <span>1 {fromToken.symbol} = {rate} {toToken.symbol}</span>
                    <span>FEE: $0.31</span>
                </div>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!numAmount}
                    className={`w-full text-lg font-bold py-4 rounded-2xl flex items-center justify-between px-6 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(159,254,106,0.2)] cursor-pointer ${
                        confirmed ? 'bg-green-500 text-white' : !numAmount ? 'bg-gray-700 text-gray-400 cursor-not-allowed hover:scale-100' : 'bg-primary hover:bg-primaryDark text-dark'
                    }`}
                >
                    <span>{confirmed ? 'Swap Confirmed!' : !numAmount ? 'Enter Amount' : 'Confirm Swap'}</span>
                    {confirmed ? <Check size={24} /> : <ArrowUpRight size={24} />}
                </button>
            </div>

        </motion.div>
    );
};
