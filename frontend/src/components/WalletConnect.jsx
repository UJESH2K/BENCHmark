import { useWeb3 } from '../context/Web3Context';
import { LogOut, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export function WalletConnect() {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet, switchToLocalhost, error } = useWeb3();

  if (isConnected) {
    return (
      <motion.div className="flex items-center gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="glass-card px-4 py-2">
          <p className="text-sm text-gray-300">Connected</p>
          <p className="text-gold font-mono text-sm">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            switchToLocalhost();
          }}
          className="btn-secondary text-xs py-2 cursor-pointer"
        >
          Switch to Hardhat
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            disconnectWallet();
          }}
          className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-all duration-300 cursor-pointer"
        >
          <LogOut size={20} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        connectWallet();
      }}
      disabled={isConnecting}
      className="btn-primary flex items-center gap-2 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Wallet size={20} />
      {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
    </motion.button>
  );
}
