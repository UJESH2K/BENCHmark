import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from './context/Web3Context';
import { WalletConnect } from './components/WalletConnect';
import { MarketCard, LeaderboardTable, SimulationStatus } from './components/Dashboard';

// New Sleek Components
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Layout/Sidebar';
import { PortfolioSummary } from './components/Dashboard/PortfolioSummary';
import { TopAssets } from './components/Dashboard/TopAssets';
import { SwapPanel } from './components/Swap/SwapPanel';
import { Playground } from './components/Playground';

import { Bell, User, Bookmark, Headphones } from 'lucide-react';

function App() {
  const { account, isConnected } = useWeb3();
  const [mockIsConnected, setMockIsConnected] = useState(false);
  const userIsConnected = isConnected || mockIsConnected;
  // Override for local testing. In real app, rely on `isConnected`.
  // Wait, I will use `isConnected` properly, but can mock it if needed.
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [simulationData, setSimulationData] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const API = (import.meta.env.VITE_API_URL || '') + '/api';

  // Fetch simulation data from orchestrator
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, marketsRes, agentsRes, tradesRes] = await Promise.all([
          fetch(`${API}/status`),
          fetch(`${API}/markets`),
          fetch(`${API}/leaderboard`),
          fetch(`${API}/trades`).catch(() => ({ ok: false })),
        ]);

        if (statusRes && statusRes.ok) setSimulationData(await statusRes.json());
        if (marketsRes && marketsRes.ok) setMarkets(await marketsRes.json());
        if (agentsRes && agentsRes.ok) setAgents(await agentsRes.json());
        if (tradesRes && tradesRes.ok) setTrades(await tradesRes.json());
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    if (userIsConnected) {
      fetchData();
      const interval = setInterval(fetchData, 2000);
      return () => clearInterval(interval);
    }
  }, [userIsConnected]);

  const handleStartSimulation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/simulation/start`, {
        method: 'POST',
      });
      if (res.ok) {
        setSimulationData(await res.json());
      }
    } catch (err) {
      console.error('Error starting simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  // Convert agents format for top assets:
  const mapAgentsToTopAssets = (agentsList) => {
    const list = agentsList.length ? agentsList : [
      { agentName: 'NaiveArbAgent', balance: 923.32, activePositions: 2, color: '#f0b90b' },
      { agentName: 'MeanRevert', balance: 421.11, activePositions: 0, color: '#26a17b' },
      { agentName: 'Momentum', balance: 1300.99, activePositions: 5, color: '#627eea' },
    ];

    return list.map((a, i) => ({
      name: a.agentName || a.name || 'Agent',
      sub: `ID \u2022 ${a.agentAddress ? a.agentAddress.slice(0, 6) : '0x12..'}`,
      value: `${(a.balance || 0).toFixed(4)} BNB`,
      change: parseFloat(((Math.random() * 10) - 4).toFixed(2)), // mock change for UI,
      color: ['#f0b90b', '#26a17b', '#627eea', '#ec4899', '#8b5cf6'][i % 5]
    }));
  };

  return (
    <div className="min-h-screen bg-dark text-white font-sans overflow-hidden">
      {!userIsConnected ? (
        // New Beautiful Landing Page
        <LandingPage onConnect={() => {
          // Provide a mock bypass for browser testing
          setMockIsConnected(true);
        }} />
      ) : (
        // Main New Dashboard Layout (Cryptfy inspired)
        <div className="flex h-screen w-full relative">

          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

          {/* Center Main Content Area */}
          <main className="flex-1 flex flex-col h-full bg-[#050b08] overflow-y-auto px-8 relative">

            {/* Top Toolbar */}
            <header className="h-24 shrink-0 flex items-center justify-between sticky top-0 z-20 bg-[#050b08]/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-medium tracking-tight">
                  {currentPage === 'dashboard' ? 'Wallet' :
                    currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                </h1>
                <WalletConnect />
              </div>

              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setCurrentPage('wallet')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer" title="My Wallet">
                  <User size={18} />
                </button>
                <button type="button" onClick={() => setCurrentPage('trades')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition relative cursor-pointer" title="Notifications">
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-ping" />
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
                  <Bell size={18} />
                </button>
              </div>
            </header>

            {/* Content Switcher */}
            <div className="pb-12 h-full">
              <AnimatePresence mode="wait">
                {currentPage === 'dashboard' && (
                  <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <PortfolioSummary balance={(trades.length * 123.45 + 10450.00).toFixed(2) || '98,230.02'} onNavigate={setCurrentPage} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <TopAssets title="Top Agents" items={mapAgentsToTopAssets(agents.slice(0, 4))} onNavigate={setCurrentPage} />
                      <div className="mt-8">
                        <h2 className="text-xl font-medium text-white mb-4">Simulation Control</h2>
                        <div className="glass-panel p-6">
                          <SimulationStatus
                            status={simulationData?.status || 'idle'}
                            currentTick={simulationData?.currentTick || 0}
                            totalTicks={simulationData?.totalTicks || 30}
                          />
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleStartSimulation();
                            }}
                            disabled={loading || simulationData?.status === 'running'}
                            className="w-full mt-4 btn-primary py-4 text-lg font-bold cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {loading ? 'Starting...' : simulationData?.status === 'running' ? 'Simulation in Progress...' : 'Start New Simulation'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentPage === 'wallet' && (
                  <motion.div key="wallet" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    {/* Reusing portfolio for Wallet view */}
                    <PortfolioSummary onNavigate={setCurrentPage} />
                    <TopAssets title="All Assets" items={mapAgentsToTopAssets(agents)} onNavigate={setCurrentPage} />
                  </motion.div>
                )}

                {currentPage === 'markets' && (
                  <motion.div key="markets" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                      {markets.map((market, idx) => (
                        <MarketCard key={market.marketId} market={market} index={idx} />
                      ))}
                      {!markets.length && <div className="text-gray-500 p-8 glass-panel w-full text-center">No active markets. Start a simulation!</div>}
                    </div>
                  </motion.div>
                )}

                {currentPage === 'leaderboard' && (
                  <motion.div key="leaderboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="glass-panel p-6">
                      <LeaderboardTable agents={agents} />
                    </div>
                  </motion.div>
                )}

                {currentPage === 'trades' && (
                  <motion.div key="trades" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="glass-panel overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/5">
                              <th className="px-6 py-4 text-left text-primary font-medium tracking-wide">Agent</th>
                              <th className="px-6 py-4 text-left text-primary font-medium tracking-wide">Market</th>
                              <th className="px-6 py-4 text-left text-primary font-medium tracking-wide">Side</th>
                              <th className="px-6 py-4 text-left text-primary font-medium tracking-wide">Amount</th>
                              <th className="px-6 py-4 text-left text-primary font-medium tracking-wide">Hash</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trades.slice(-20).reverse().map((trade, idx) => (
                              <motion.tr
                                key={idx}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                              >
                                <td className="px-6 py-4 font-medium text-white">{trade.agentName}</td>
                                <td className="px-6 py-4 text-gray-300">{trade.marketId}</td>
                                <td className="px-6 py-4">
                                  <span className={trade.side === 'YES' ? 'text-primary' : 'text-red-400'}>
                                    {trade.side}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-300">{trade.size?.toFixed(3)} BNB</td>
                                <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                  {trade.txHash?.slice(0, 10)}...
                                </td>
                              </motion.tr>
                            ))}
                            {!trades.length && (
                              <tr><td colSpan="5" className="text-center py-8 text-gray-500 font-medium">No transactions yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentPage === 'playground' && (
                  <motion.div key="playground" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full -mx-8">
                    <Playground />
                  </motion.div>
                )}

                {currentPage === 'watchlist' && (
                  <motion.div key="watchlist" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="glass-panel p-8 text-center">
                      <Bookmark size={48} className="mx-auto text-primary mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Watchlist</h2>
                      <p className="text-gray-400 mb-6">Track your favourite agents and markets in one place.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {['NaiveArb Agent', 'MeanRevert Agent', 'Momentum Agent'].map((name, i) => (
                          <div key={i} className="glass-panel p-4 flex items-center gap-3 hover:bg-white/5 transition cursor-pointer" onClick={() => setCurrentPage('leaderboard')}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-dark" style={{backgroundColor: ['#f0b90b','#26a17b','#627eea'][i]}}>{name[0]}</div>
                            <div className="text-left flex-1">
                              <p className="text-white font-medium">{name}</p>
                              <p className="text-xs text-gray-500">Active · {3 + i} trades</p>
                            </div>
                            <span className="text-primary text-sm font-bold">View →</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setCurrentPage('playground')} className="mt-6 px-6 py-3 bg-primary text-dark rounded-xl font-bold hover:bg-primaryDark transition cursor-pointer">Go to Playground</button>
                    </div>
                  </motion.div>
                )}

                {currentPage === 'support' && (
                  <motion.div key="support" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="glass-panel p-8 text-center">
                      <Headphones size={48} className="mx-auto text-primary mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Support</h2>
                      <p className="text-gray-400 mb-6">Need help? Here are some quick links.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {[
                          { label: 'Getting Started', desc: 'Connect wallet & join the arena', page: 'playground' },
                          { label: 'View Markets', desc: 'Browse active prediction markets', page: 'markets' },
                          { label: 'Leaderboard', desc: 'See top-performing agents', page: 'leaderboard' },
                        ].map((item, i) => (
                          <div key={i} onClick={() => setCurrentPage(item.page)} className="glass-panel p-6 hover:bg-white/5 hover:border-primary/30 border border-white/5 transition cursor-pointer rounded-2xl">
                            <h3 className="text-white font-bold mb-1">{item.label}</h3>
                            <p className="text-sm text-gray-400">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-8 text-sm text-gray-500">GitHub: <a href="https://github.com/UJESH2K/BENCHmark" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">UJESH2K/BENCHmark</a></p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Background Glows for main content area */}
            <div className="fixed top-0 left-0 w-[50vh] h-[50vh] bg-primary/20 blur-[150px] rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2" />
          </main>

          {/* Right Side Swap Panel */}
          <SwapPanel />

        </div>
      )}
    </div>
  );
}

export default App;
