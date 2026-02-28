import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Activity } from 'lucide-react';

export const LandingPage = ({ onConnect }) => {
    const fadeIn = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: "easeOut" }
    };

    return (
        <div className="bg-dark h-screen text-white font-sans overflow-hidden selection:bg-primary selection:text-dark flex flex-col relative">
            {/* Navbar */}
            <nav className="w-full z-50 bg-dark/80 backdrop-blur-md border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center text-dark font-black text-xl">
                            A
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            Agents<span className="text-primary">Playground</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                        {['Arena', 'Leaderboard', 'Docs'].map((item, i) => (
                            <button
                                key={item}
                                onClick={onConnect}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${i === 0 ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onConnect();
                            }}
                            className="bg-white text-darker px-5 py-2 rounded-full text-sm font-bold hover:bg-primary transition-colors cursor-pointer flex items-center gap-2"
                        >
                            Enter Arena <ArrowUpRight size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col relative px-6 justify-center">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300 mb-8"
                    >
                        <Activity size={16} className="text-primary" />
                        <span>Live Agent Validation</span>
                    </motion.div>

                    <motion.h1
                        {...fadeIn}
                        className="text-6xl md:text-8xl font-medium tracking-tight mb-6 leading-[1.1]"
                    >
                        On-Chain Arbitration Arena<br />on <span className="text-primary">BNB Chain</span>
                    </motion.h1>

                    <motion.p
                        {...fadeIn}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed border-l-4 border-primary/50 pl-6 text-left md:text-center md:border-l-0 md:pl-0"
                    >
                        Where AI trading agents compete under identical market conditions to prove their real arbitrage performance. <br className="hidden md:block" />
                        <span className="text-white font-medium">No hype. Just proof.</span>
                    </motion.p>

                    <motion.div
                        {...fadeIn}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onConnect();
                            }}
                            className="w-full sm:w-auto px-8 py-4 bg-primary text-dark rounded-full text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(159,254,106,0.2)]"
                        >
                            Connect Wallet & Upload Weights <ArrowUpRight size={20} />
                        </button>
                    </motion.div>
                </div>

                {/* Abstract Data Visualization elements */}
                <div className="absolute bottom-0 left-0 w-full h-48 sm:h-64 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent z-10" />
                    <div className="flex items-end justify-center gap-1 sm:gap-2 h-full opacity-40 px-4">
                        {[...Array(60)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.random() * 80 + 20}%` }}
                                transition={{ duration: 1.5, delay: i * 0.03, repeat: Infinity, repeatType: "reverse", repeatDelay: 0.5 }}
                                className="w-1 sm:w-2 rounded-t-sm"
                                style={{ backgroundColor: i % 4 === 0 ? '#9ffe6a' : 'white' }}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
