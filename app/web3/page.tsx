'use client';

import { useState, useEffect } from 'react';
import { createWalletClient, custom, type Address, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  parseAnyRPCResponse,
  RPCMethod,
  type AuthChallengeResponse,
  type AuthRequestParams,
  createECDSAMessageSigner,
  createGetLedgerBalancesMessage,
  type GetLedgerBalancesResponse,
  type BalanceUpdateResponse,
  type TransferResponse,
} from '@erc7824/nitrolite';
import { Web3PostList } from '../../components/web3/Web3PostList';
import { BalanceDisplay } from '../../components/web3/BalanceDisplay';
import { useTransfer } from '../../hooks/useTransfer';
import { posts } from '../../lib/data/posts';
import { webSocketService, type WsStatus } from '../../lib/websocket';
import {
  generateSessionKey,
  getStoredSessionKey,
  storeSessionKey,
  removeSessionKey,
  storeJWT,
  removeJWT,
  type SessionKey,
} from '../../lib/web3-utils';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// EIP-712 domain for Nexus authentication
const getAuthDomain = () => ({
  name: 'Nexus',
});

// Authentication constants
const AUTH_SCOPE = 'nexus.app';
const APP_NAME = 'Nexus';
const SESSION_DURATION = 3600; // 1 hour

export default function Web3Page() {
  const [account, setAccount] = useState<Address | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');
  // Authentication state
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthAttempted, setIsAuthAttempted] = useState(false);
  const [sessionExpireTimestamp, setSessionExpireTimestamp] = useState<string>('');
  // Balance state
  const [balances, setBalances] = useState<Record<string, string> | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  // Transfer state
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  // Use transfer hook
  const { handleTransfer: transferFn } = useTransfer(sessionKey, isAuthenticated);

  useEffect(() => {
    // Get or generate session key on startup
    const existingSessionKey = getStoredSessionKey();
    if (existingSessionKey) {
      setSessionKey(existingSessionKey);
    } else {
      const newSessionKey = generateSessionKey();
      storeSessionKey(newSessionKey);
      setSessionKey(newSessionKey);
    }

    webSocketService.addStatusListener(setWsStatus);
    // Don't auto-connect - wait for wallet connection

    return () => {
      webSocketService.removeStatusListener(setWsStatus);
    };
  }, []);

  // Auto-trigger authentication when conditions are met
  useEffect(() => {
    if (account && sessionKey && wsStatus === 'Connected' && !isAuthenticated && !isAuthAttempted) {
      setIsAuthAttempted(true);

      // Generate fresh timestamp for this auth attempt
      const expireTimestamp = String(Math.floor(Date.now() / 1000) + SESSION_DURATION);
      setSessionExpireTimestamp(expireTimestamp);

      const authParams: AuthRequestParams = {
        address: account,
        session_key: sessionKey.address,
        app_name: APP_NAME,
        expire: expireTimestamp,
        scope: AUTH_SCOPE,
        application: account,
        allowances: [],
      };

      createAuthRequestMessage(authParams).then((payload) => {
        webSocketService.send(payload);
      });
    }
  }, [account, sessionKey, wsStatus, isAuthenticated, isAuthAttempted]);

  // Automatically fetch balances when user is authenticated
  useEffect(() => {
    if (isAuthenticated && sessionKey && account) {
      console.log('Authenticated! Fetching ledger balances...');
      setIsLoadingBalances(true);

      const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

      createGetLedgerBalancesMessage(sessionSigner, account)
        .then((getBalancesPayload) => {
          console.log('Sending balance request...');
          webSocketService.send(getBalancesPayload);
        })
        .catch((error) => {
          console.error('Failed to create balance request:', error);
          setIsLoadingBalances(false);
        });
    }
  }, [isAuthenticated, sessionKey, account]);

  // Handle support function for PostList
  const handleSupport = async (recipient: string, amount: string) => {
    setIsTransferring(true);
    setTransferStatus('Sending support...');

    const result = await transferFn(recipient as Address, amount);

    if (result.success) {
      setTransferStatus('Support sent!');
    } else {
      setIsTransferring(false);
      setTransferStatus(null);
      if (result.error) {
        alert(result.error);
      }
    }
  };

  // Handle server messages for authentication
  useEffect(() => {
    const handleMessage = async (data: any) => {
      const response = parseAnyRPCResponse(JSON.stringify(data));

      // Handle auth challenge
      if (
        response.method === RPCMethod.AuthChallenge &&
        walletClient &&
        sessionKey &&
        account &&
        sessionExpireTimestamp
      ) {
        const challengeResponse = response as AuthChallengeResponse;

        const authParams = {
          scope: AUTH_SCOPE,
          application: walletClient.account?.address as `0x${string}`,
          participant: sessionKey.address as `0x${string}`,
          expire: sessionExpireTimestamp,
          allowances: [],
        };

        const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, getAuthDomain());

        try {
          const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, challengeResponse);
          webSocketService.send(authVerifyPayload);
        } catch (error) {
          alert('Signature rejected. Please try again.');
          setIsAuthAttempted(false);
        }
      }

      // Handle auth success
      if (response.method === RPCMethod.AuthVerify && response.params?.success) {
        setIsAuthenticated(true);
        if (response.params.jwtToken) storeJWT(response.params.jwtToken);
      }

      // Handle balance responses
      if (response.method === RPCMethod.GetLedgerBalances) {
        const balanceResponse = response as GetLedgerBalancesResponse;
        const balances = balanceResponse.params.ledgerBalances;

        console.log('Received balance response:', balances);

        if (balances && balances.length > 0) {
          const balancesMap = Object.fromEntries(
            balances.map((balance) => [balance.asset, balance.amount]),
          );
          console.log('Setting balances:', balancesMap);
          setBalances(balancesMap);
        } else {
          console.log('No balance data received - wallet appears empty');
          setBalances({});
        }
        setIsLoadingBalances(false);
      }

      // Handle live balance updates
      if (response.method === RPCMethod.BalanceUpdate) {
        const balanceUpdate = response as BalanceUpdateResponse;
        const balances = balanceUpdate.params.balanceUpdates;

        console.log('Live balance update received:', balances);

        const balancesMap = Object.fromEntries(
          balances.map((balance) => [balance.asset, balance.amount]),
        );
        console.log('Updating balances in real-time:', balancesMap);
        setBalances(balancesMap);
      }

      // Handle transfer response
      if (response.method === RPCMethod.Transfer) {
        const transferResponse = response as TransferResponse;
        console.log('Transfer completed:', transferResponse.params);

        setIsTransferring(false);
        setTransferStatus(null);

        alert(`Transfer completed successfully!`);
      }

      // Handle errors
      if (response.method === RPCMethod.Error) {
        console.error('RPC Error:', response.params);

        if (isTransferring) {
          setIsTransferring(false);
          setTransferStatus(null);
          alert(`Transfer failed: ${response.params.error}`);
        } else {
          removeJWT();
          removeSessionKey();
          alert(`Error: ${response.params.error}`);
          setIsAuthAttempted(false);
        }
      }
    };

    webSocketService.addMessageListener(handleMessage);
    return () => webSocketService.removeMessageListener(handleMessage);
  }, [walletClient, sessionKey, sessionExpireTimestamp, account, isTransferring]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask not found! Please install MetaMask from https://metamask.io/');
      return;
    }

    try {
      // Check current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x1') { // Not mainnet
        alert('Please switch to Ethereum Mainnet in MetaMask for this workshop');
      }

      const tempClient = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum),
      });
      const [address] = await tempClient.requestAddresses();

      if (!address) {
        alert('No wallet address found. Please ensure MetaMask is unlocked.');
        return;
      }

      const walletClient = createWalletClient({
        account: address,
        chain: mainnet,
        transport: custom(window.ethereum),
      });

      setWalletClient(walletClient);
      setAccount(address);

      // Connect to the specific RPC endpoint after wallet connection
      console.log('Wallet connected, switching to clearnet-sandbox RPC...');
      webSocketService.connect('wss://clearnet-sandbox.yellow.com/ws');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
      return;
    }
  };

  const formatAddress = (address: Address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="dark min-h-screen bg-background text-foreground" 
         style={{ backgroundColor: 'hsl(20, 14.3%, 4.1%)', color: 'hsl(0, 0%, 95%)' }}>
      <div className="max-w-6xl mx-auto px-8">
        <header className="text-center py-16 border-b border-border relative">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-7xl font-black text-primary font-mono mb-4 transform -rotate-2 italic" 
                style={{
                  textShadow: '3px 3px 0px hsl(var(--primary) / 0.8), 6px 6px 0px hsl(var(--primary) / 0.3), 9px 9px 0px hsl(var(--primary) / 0.2)' 
                }}
                data-testid="title-nexus">
              Nexus
            </h1>
            <p className="text-lg text-foreground absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 bg-background px-4 whitespace-nowrap"
               data-testid="text-tagline">
              Decentralized insights for the next generation of builders
            </p>
          </div>
          
          {/* Header controls */}
          <div className="absolute top-8 right-8 flex items-center gap-4">
            {/* Balance display when authenticated */}
            {isAuthenticated && (
              <BalanceDisplay
                balance={isLoadingBalances ? 'Loading...' : (balances?.['usdc'] ?? null)}
                symbol="USDC"
              />
            )}
            
            {/* WebSocket status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              wsStatus === 'Connected' ? 'bg-green-500/20 text-green-400' :
              wsStatus === 'Connecting' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`} data-testid="ws-status">
              <span className={`w-2 h-2 rounded-full ${
                wsStatus === 'Connected' ? 'bg-green-400' :
                wsStatus === 'Connecting' ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></span>
              {wsStatus}
            </div>
            
            {/* Wallet connector */}
            <div className="wallet-connector">
              {account ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                  <span className="text-sm font-mono text-primary" data-testid="wallet-address">
                    {formatAddress(account)}
                  </span>
                  {isAuthenticated && (
                    <span className="text-xs text-green-400 font-medium" data-testid="auth-status">
                      ✓ Authenticated
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/80 transition-colors"
                  data-testid="connect-wallet-button"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="py-8">
          <Web3PostList 
            posts={posts}
            isWalletConnected={!!account}
            isAuthenticated={isAuthenticated}
            onTransfer={handleSupport}
            isTransferring={isTransferring}
          />
        </main>
      </div>
    </div>
  );
}