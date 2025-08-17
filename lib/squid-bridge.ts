import { Squid } from '@0xsquid/sdk';
import { ethers } from 'ethers';
import axios from 'axios';

// Define proper wallet interface for SquidRouter
interface SquidWallet {
  signMessage?(message: string): Promise<string>;
  signTransaction?(transaction: any): Promise<string>;
  getAddress(): Promise<string>;
  provider?: ethers.Provider;
}

// SquidRouter Bridge Service for LenZ to Base bridging
export class SquidBridgeService {
  private squid: Squid | null = null;
  private initialized = false;

  constructor() {
    this.squid = new Squid({
      baseUrl: 'https://v2.api.squidrouter.com',
      integratorId: 'lenz-camera-app', // Replace with actual integrator ID when approved
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.squid!.init();
      this.initialized = true;
      console.log('SquidRouter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SquidRouter:', error);
      throw error;
    }
  }

  // Get available routes for bridging LENZ tokens from Saga to Base
  async getBridgeRoute(params: BridgeRouteParams): Promise<BridgeRoute> {
    await this.initialize();

    try {
      const routeParams = {
        fromChain: SAGA_CHAINLET_ID, // Saga chainlet chain ID
        toChain: BASE_CHAIN_ID, // Base mainnet
        fromToken: LENZ_TOKEN_ADDRESS, // LENZ token on Saga
        toToken: USDC_BASE_ADDRESS, // USDC on Base for rewards
        fromAmount: params.amount,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        slippageConfig: {
          autoMode: 1 // Auto slippage
        }
      };

      const { route } = await this.squid!.getRoute(routeParams);
      
      return {
        route,
        estimatedTime: route.estimate.estimatedRouteDuration || 180, // Default 3 minutes
        gasCost: route.estimate.gasCosts || [],
        exchangeRate: route.estimate.exchangeRate || '1',
        slippage: (route.estimate as any)?.slippagePercent || (route.estimate as any)?.slippage || 1
      };
    } catch (error) {
      console.error('Failed to get bridge route:', error);
      throw new Error('Unable to find bridge route. Please try again later.');
    }
  }

  // Execute bridge transaction
  async executeBridge(
    route: any,
    signer: ethers.Signer
  ): Promise<BridgeTransactionResult> {
    await this.initialize();

    // Ensure we have a proper signer
    if (!signer || typeof signer.signTransaction !== 'function') {
      throw new Error('Valid signer required for bridge transaction');
    }

    try {
      // Create a wallet adapter for SquidRouter
      const walletAdapter = {
        signMessage: async (message: string) => {
          return await signer.signMessage(message);
        },
        signTransaction: async (transaction: any) => {
          return await signer.signTransaction(transaction);
        },
        getAddress: async () => {
          return await signer.getAddress();
        },
        provider: signer.provider
      };

      const result = await this.squid!.executeRoute({
        route,
        signer: walletAdapter as any // Use type assertion as fallback
      });

      return {
        transactionHash: (result as any)?.transactionId || (result as any)?.txHash || (result as any)?.hash || 'pending',
        routeRequestId: route.routeRequestId || route.id || 'pending',
        status: 'pending',
        fromChain: SAGA_CHAINLET_ID,
        toChain: BASE_CHAIN_ID,
        amount: route.params?.fromAmount || route.fromAmount || '0',
        estimatedTime: route.estimate?.estimatedRouteDuration || 180
      };
    } catch (error) {
      console.error('Bridge execution failed:', error);
      throw new Error('Bridge transaction failed. Please check your wallet and try again.');
    }
  }

  // Track bridge transaction status
  async getTransactionStatus(routeRequestId: string, quoteId?: string): Promise<BridgeTransactionStatus> {
    await this.initialize();

    try {
      const status = await this.squid!.getStatus({
        transactionId: routeRequestId,
        quoteId: quoteId || routeRequestId // Use routeRequestId as fallback
      });

      return {
        status: status.squidTransactionStatus || 'unknown',
        fromChain: {
          transactionHash: status.fromChain?.transactionId,
          status: (status.fromChain as any)?.transactionStatus || (status.fromChain as any)?.status || 'pending'
        },
        toChain: {
          transactionHash: status.toChain?.transactionId,
          status: (status.toChain as any)?.transactionStatus || (status.toChain as any)?.status || 'pending'
        },
        error: status.error
      };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  // Get supported tokens and chains
  async getSupportedChains(): Promise<ChainInfo[]> {
    try {
      const response = await axios.get('https://v2.api.squidrouter.com/v2/chains', {
        headers: {
          'x-integrator-id': 'lenz-camera-app'
        }
      });
      return response.data.chains;
    } catch (error) {
      console.error('Failed to fetch supported chains:', error);
      return [];
    }
  }

  // Calculate bridge fees and estimates
  async calculateBridgeFees(amount: string, fromAddress: string): Promise<BridgeFeeEstimate> {
    try {
      const route = await this.getBridgeRoute({
        amount,
        fromAddress,
        toAddress: fromAddress // Same address on destination
      });

      const gasCosts = route.gasCost;
      const totalGasCost = gasCosts.reduce((sum: number, cost: any) => {
        return sum + parseFloat(cost.amount);
      }, 0);

      return {
        bridgeFee: route.route.estimate.feeCosts?.[0]?.amount || '0',
        gasFee: totalGasCost.toString(),
        exchangeRate: route.exchangeRate,
        estimatedOutput: route.route.estimate.toAmount,
        slippage: route.slippage,
        estimatedTime: route.estimatedTime
      };
    } catch (error) {
      console.error('Failed to calculate bridge fees:', error);
      throw error;
    }
  }
}

// Constants for chain and token configuration
export const SAGA_CHAINLET_ID = '13381'; // Saga chainlet chain ID
export const BASE_CHAIN_ID = '8453'; // Base mainnet
export const LENZ_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with actual LENZ token address
export const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

// Type definitions
export interface BridgeRouteParams {
  amount: string; // Amount in wei
  fromAddress: string;
  toAddress: string;
}

export interface BridgeRoute {
  route: any;
  estimatedTime: number; // In seconds
  gasCost: any[];
  exchangeRate: string;
  slippage: number;
}

export interface BridgeTransactionResult {
  transactionHash: string;
  routeRequestId: string;
  status: 'pending' | 'success' | 'failed';
  fromChain: string;
  toChain: string;
  amount: string;
  estimatedTime: number;
}

export interface BridgeTransactionStatus {
  status: string;
  fromChain: {
    transactionHash?: string;
    status?: string;
  };
  toChain: {
    transactionHash?: string;
    status?: string;
  };
  error?: string;
}

export interface ChainInfo {
  chainId: string;
  networkName: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
  infoURL: string;
}

export interface BridgeFeeEstimate {
  bridgeFee: string;
  gasFee: string;
  exchangeRate: string;
  estimatedOutput: string;
  slippage: number;
  estimatedTime: number;
}

// Export singleton instance
export const squidBridgeService = new SquidBridgeService();