import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BarChart2, Shield, Globe, Zap, MessageSquare } from 'lucide-react';

export const LandingPage = ({ onConnect }) => {
    const fadeIn = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: "easeOut" }
    };

    return (
        <div className="bg-dark min-h-screen text-white font-sans overflow-x-hidden selection:bg-primary selection:text-dark">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center text-dark font-black text-xl">
                            A
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            Agents<span className="text-primary">Hub</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                        {['Home', 'Trade', 'Platforms', 'Market', 'Resources', 'Company'].map((item, i) => (
                            <button
                                key={item}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${i === 0 ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button type="button" className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer">
                            Risk-Free Account ↗
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onConnect();
                            }}
                            className="bg-white text-darker px-5 py-2 rounded-full text-sm font-bold hover:bg-primary transition-colors cursor-pointer"
                        >
                            Start Trading ↗
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 px-6 overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8"
                    >
                        <BarChart2 size={16} className="text-primary" />
                        <span>Daily Finances</span>
                    </motion.div>

                    <motion.h1
                        {...fadeIn}
                        className="text-6xl md:text-8xl font-medium tracking-tight mb-8 leading-tight"
                    >
                        Your Gateway to Global<br />Financial Markets
                    </motion.h1>

                    <motion.p
                        {...fadeIn}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        Trade Crypto, Stocks, Indices, and more — with institutional-grade AI agents, tight spreads, and local regulation.
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
                            className="w-full sm:w-auto px-8 py-4 bg-white text-darker rounded-full text-lg font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Open App <ArrowUpRight size={20} />
                        </button>
                        <button type="button" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full text-lg font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            Explore Markets <ArrowUpRight size={20} />
                        </button>
                    </motion.div>
                </div>

                {/* Abstract Data Visualization elements */}
                <div className="mt-20 w-full max-w-5xl mx-auto h-64 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent z-10" />
                    <div className="flex items-end justify-center gap-2 h-full opacity-30">
                        {[...Array(40)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.random() * 80 + 20}%` }}
                                transition={{ duration: 1.5, delay: i * 0.05, repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
                                className="w-2 rounded-t-sm"
                                style={{ backgroundColor: i % 3 === 0 ? '#9ffe6a' : 'white' }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Licensing / Info Section */}
            <section className="py-24 px-6 relative bg-darker z-10 w-full">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={fadeIn}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-6">
                            <Shield size={16} className="text-primary" />
                            <span>License and Regulation</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-medium mb-6">Agents' Hub<br />Licensing & Regulation</h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Licensed to Ensure Transparent and Secure Trading. Our AI agents operate under strictly defined risk limits enforced entirely on-chain through advanced smart contract validations.
                        </p>
                        <div className="flex items-center gap-4">
                            <button className="px-6 py-3 bg-white text-darker rounded-full font-bold hover:bg-gray-200 transition-colors">
                                View Details
                            </button>
                            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-full font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                                Contact Support ↗
                            </button>
                        </div>
                    </motion.div>

                    {/* Grid visual */}
                    <div className="relative">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Globe, title: "Global Assets", desc: "Access 100+ prediction markets." },
                                { icon: Zap, title: "Lightning Fast", desc: "BNB Chain optimized execution." },
                                { icon: Shield, title: "On-chain Escrow", desc: "Non-custodial smart contracts." },
                                { icon: MessageSquare, title: "AI Driven", desc: "Autonomous yield generation." },
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="glass-panel p-6 border border-white/5 hover:border-primary/30 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 text-primary">
                                        <feature.icon size={20} />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-400">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Floating Chat Button */}
            <button className="fixed bottom-6 right-6 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform text-darker z-50">
                <MessageSquare size={24} />
            </button>
        </div>
    );
};
