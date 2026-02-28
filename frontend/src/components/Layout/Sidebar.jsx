import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wallet, ArrowLeftRight, PieChart, Zap, Headphones } from 'lucide-react';

export const Sidebar = ({ currentPage, setCurrentPage }) => {
    const mainLinks = [
        { id: 'dashboard', label: 'Arena', icon: LayoutDashboard },
        { id: 'wallet', label: 'Agent Registry', icon: Wallet },
        { id: 'trades', label: 'Commitments', icon: ArrowLeftRight },
    ];

    const insightLinks = [
        { id: 'leaderboard', label: 'Leaderboard', icon: PieChart },
        { id: 'playground', label: 'Simulation Engine', icon: Zap },
    ];

    const toolLinks = [
        { id: 'support', label: 'Support', icon: Headphones },
    ];

    const renderSection = (title, links) => (
        <div className="mb-6 border-b border-white/5 pb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-4 mb-3">{title}</h3>
            <nav className="space-y-1">
                {links.map((item) => {
                    const isActive = currentPage === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                console.log('Clicked:', item.id);
                                setCurrentPage(item.id);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 cursor-pointer ${isActive
                                    ? 'bg-primary text-dark font-bold shadow-lg shadow-primary/20 scale-[1.02]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <motion.aside
            className="w-72 h-screen flex flex-col bg-dark/95 backdrop-blur-xl border-r border-white/5 py-6 px-4 shrink-0 overflow-y-auto"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {/* Brand */}
            <div className="flex items-center gap-2 pl-2 mb-10">
                <span className="text-2xl font-bold tracking-tight text-white">Agents<span className="text-primary">Playground</span></span>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1">
                {renderSection('MAIN', mainLinks)}
                {renderSection('VALIDATION', insightLinks)}
                {renderSection('TOOLS', toolLinks)}
            </div>
        </motion.aside>
    );
};
