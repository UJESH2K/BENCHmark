import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chain, setChain] = useState(null);
  const [error, setError] = useState(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkIfConnected();
    // Listen for account and chain changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkIfConnected = async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      // Reinitialize provider with new account
      await connectWallet();
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Create provider
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();

      // Get chain info
      const network = await ethersProvider.getNetwork();

      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAccount(accounts[0]);
      setChain({
        chainId: network.chainId,
        name: network.name,
      });
    } catch (err) {
      setError(err.message);
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChain(null);
    setError(null);
  };

  const switchToLocalhost = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
    } catch (err) {
      if (err.code === 4902) {
        // Chain not added
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Hardhat Local',
              rpcUrls: ['http://localhost:8545'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            }],
          });
        } catch (addErr) {
          setError('Failed to add Hardhat network');
        }
      } else {
        setError('Failed to switch network');
      }
    }
  };

  const value = {
    account: account?.toLowerCase(),
    provider,
    signer,
    isConnecting,
    isConnected: !!account,
    chain,
    error,
    connectWallet,
    disconnectWallet,
    switchToLocalhost,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
