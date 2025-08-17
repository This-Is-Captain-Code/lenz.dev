'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// LenZ Chainlet Configuration
const LENZ_CHAINLET_CONFIG = {
  chainId: '0x' + parseInt('2755424185602000').toString(16), // Convert to hex
  chainName: 'LenZ Chainlet',
  nativeCurrency: {
    name: 'LENZ',
    symbol: 'LENZ',
    decimals: 18,
  },
  rpcUrls: ['https://lenz-2755424185602000-1.jsonrpc.sagarpc.io'],
  blockExplorerUrls: ['https://lenz-2755424185602000-1.sagaexplorer.io'],
  websocketUrl: 'https://lenz-2755424185602000-1.ws.sagarpc.io'
};

interface LenzWallet {
  address: string;
  privateKey: string;
  balance: string;
  isConnected: boolean;
}

interface LenzWalletContextType {
  wallet: LenzWallet | null;
  isLoading: boolean;
  error: string | null;
  createWallet: () => Promise<void>;
  connectWallet: (privateKey: string) => Promise<void>;
  importWallet: (privateKey: string) => Promise<void>;
  disconnectWallet: () => void;
  getBalance: () => Promise<string>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  addToMetaMask: () => Promise<void>;
  exportPrivateKey: () => string | null;
  chainConfig: typeof LENZ_CHAINLET_CONFIG;
}

const LenzWalletContext = createContext<LenzWalletContextType | undefined>(undefined);

export function LenzWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<LenzWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);

  // Initialize provider
  useEffect(() => {
    const rpcProvider = new ethers.JsonRpcProvider(LENZ_CHAINLET_CONFIG.rpcUrls[0]);
    setProvider(rpcProvider);
    
    // Try to restore wallet from localStorage
    const savedWallet = localStorage.getItem('lenz-wallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setWallet(walletData);
      } catch (err) {
        console.error('Failed to restore wallet:', err);
        localStorage.removeItem('lenz-wallet');
      }
    }
  }, []);

  // Update balance when wallet changes
  useEffect(() => {
    if (wallet && provider) {
      getBalance();
    }
  }, [wallet, provider]);

  const createWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate new wallet
      const newWallet = ethers.Wallet.createRandom();
      const address = newWallet.address;
      const privateKey = newWallet.privateKey;

      // Connect to provider
      const walletWithProvider = newWallet.connect(provider!);
      
      // Get initial balance
      const balance = await walletWithProvider.provider!.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);

      const walletData: LenzWallet = {
        address,
        privateKey,
        balance: formattedBalance,
        isConnected: true
      };

      setWallet(walletData);
      
      // Save to localStorage (Note: In production, consider more secure storage)
      localStorage.setItem('lenz-wallet', JSON.stringify({
        ...walletData,
        privateKey: privateKey // Consider encrypting this
      }));

      console.log('New LenZ wallet created:', address);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
      console.error('Error creating wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async (privateKey: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const walletInstance = new ethers.Wallet(privateKey, provider);
      const address = walletInstance.address;
      const balance = await provider!.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);

      const walletData: LenzWallet = {
        address,
        privateKey,
        balance: formattedBalance,
        isConnected: true
      };

      setWallet(walletData);
      localStorage.setItem('lenz-wallet', JSON.stringify(walletData));

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const importWallet = async (privateKey: string) => {
    return connectWallet(privateKey);
  };

  const disconnectWallet = () => {
    setWallet(null);
    localStorage.removeItem('lenz-wallet');
  };

  const getBalance = async (): Promise<string> => {
    if (!wallet || !provider) return '0';
    
    try {
      const balance = await provider.getBalance(wallet.address);
      const formattedBalance = ethers.formatEther(balance);
      
      setWallet(prev => prev ? { ...prev, balance: formattedBalance } : null);
      return formattedBalance;
    } catch (err) {
      console.error('Failed to get balance:', err);
      return '0';
    }
  };

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    if (!wallet || !provider) throw new Error('Wallet not connected');

    try {
      const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
      const tx = await walletInstance.sendTransaction({
        to,
        value: ethers.parseEther(amount)
      });
      
      await tx.wait();
      
      // Update balance after transaction
      await getBalance();
      
      return tx.hash;
    } catch (err: any) {
      throw new Error(err.message || 'Transaction failed');
    }
  };

  const addToMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: LENZ_CHAINLET_CONFIG.chainId,
          chainName: LENZ_CHAINLET_CONFIG.chainName,
          nativeCurrency: LENZ_CHAINLET_CONFIG.nativeCurrency,
          rpcUrls: LENZ_CHAINLET_CONFIG.rpcUrls,
          blockExplorerUrls: LENZ_CHAINLET_CONFIG.blockExplorerUrls,
        }],
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add network to MetaMask');
    }
  };

  const exportPrivateKey = (): string | null => {
    return wallet?.privateKey || null;
  };

  const value: LenzWalletContextType = {
    wallet,
    isLoading,
    error,
    createWallet,
    connectWallet,
    importWallet,
    disconnectWallet,
    getBalance,
    sendTransaction,
    addToMetaMask,
    exportPrivateKey,
    chainConfig: LENZ_CHAINLET_CONFIG
  };

  return (
    <LenzWalletContext.Provider value={value}>
      {children}
    </LenzWalletContext.Provider>
  );
}

export function useLenzWallet() {
  const context = useContext(LenzWalletContext);
  if (context === undefined) {
    throw new Error('useLenzWallet must be used within a LenzWalletProvider');
  }
  return context;
}