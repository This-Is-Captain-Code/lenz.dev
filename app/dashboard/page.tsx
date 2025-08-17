'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Wallet, PaperPlaneTilt, ArrowsClockwise, CurrencyDollar, User, Coins } from '@phosphor-icons/react';
import { useLenzWallet } from '../../providers/LenzWalletProvider';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { LenzWalletModal } from '../../components/lenz-wallet/LenzWalletModal';
import { Lens } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function DashboardPage() {
  const router = useRouter();
  const { wallet, isLoading } = useLenzWallet();
  const { isFrameReady } = useMiniKit();
  const [activeTab, setActiveTab] = useState<'tokens' | 'lenses'>('tokens');
  const [copied, setCopied] = useState(false);
  
  // Copy wallet address to clipboard
  const copyWalletAddress = async () => {
    if (wallet?.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      } catch (error) {
        console.error('Failed to copy wallet address:', error);
      }
    }
  };

  // Mock token data - in production, fetch from wallet APIs
  const tokens = [
    {
      id: 'usd-coin',
      name: 'USD Coin',
      symbol: 'USDC',
      balance: '50.32984',
      value: '$50.00',
      change: '+0.01%',
      changeColor: 'text-green-400',
      icon: '💵'
    },
    {
      id: 'cena-coin',
      name: 'CenaCoin',
      symbol: 'JOHN',
      balance: '12.34567',
      value: '$890.00',
      change: '+1.23%',
      changeColor: 'text-green-400',
      icon: '🪙'
    },
    {
      id: 'prison-mike',
      name: 'PrisonMike',
      symbol: 'MGS',
      balance: '99.86000',
      value: '$100.00',
      change: '-2.56%',
      changeColor: 'text-red-400',
      icon: '👨‍💼'
    },
    {
      id: 'lenz-token',
      name: 'LenZ Token',
      symbol: 'LENZ',
      balance: wallet?.balance || '0.00000',
      value: '$' + (parseFloat(wallet?.balance || '0') * 12.5).toFixed(2),
      change: '+7.89%',
      changeColor: 'text-green-400',
      icon: '📸'
    },
    {
      id: 'cool-cauli',
      name: 'CoolCauli',
      symbol: 'CCF',
      balance: '10.00000',
      value: '$90.00',
      change: '-10.00%',
      changeColor: 'text-red-400',
      icon: '🥦'
    }
  ];

  // Fetch user's lenses
  const { data: userLenses = [], isLoading: isLoadingLenses } = useQuery<Lens[]>({
    queryKey: ['/api/my-lenses'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/my-lenses');
        return result.map((ul: any) => ul.lens);
      } catch (error) {
        return [];
      }
    }
  });

  // Show wallet creation screen if no wallet exists
  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#990022] to-[#220099] text-white flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="absolute top-6 left-6">
          <Button
            variant="outline"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>

        {/* Wallet Creation Content */}
        <div className="text-center space-y-8 max-w-md">
          <div className="space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-white/10 flex items-center justify-center">
              <Wallet size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Create LenZ Wallet</h1>
            <p className="text-white/70 text-lg">
              Create your LenZ chainlet wallet to access your dashboard and manage your LENZ tokens.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 space-y-4 border border-white/20">
            <h3 className="font-semibold text-lg">LenZ Chainlet Features</h3>
            <ul className="text-white/80 space-y-2 text-left">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Native LENZ token support
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Optimized for AR photo NFTs
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Low gas fees on Saga blockchain
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Dedicated LenZ ecosystem
              </li>
            </ul>
          </div>

          <LenzWalletModal>
            <Button 
              size="lg"
              className="w-full bg-white text-black hover:bg-gray-100 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Creating Wallet...
                </div>
              ) : (
                <>
                  <Wallet size={20} className="mr-2" />
                  Create LenZ Wallet
                </>
              )}
            </Button>
          </LenzWalletModal>
        </div>
      </div>
    );
  }

  // Calculate LENZ token balance in USD (mock rate: 1 LENZ = $12.50)
  const lenzBalance = parseFloat(wallet.balance);
  const lenzValueUSD = lenzBalance * 12.50;
  const dailyChange = lenzValueUSD * -0.05; // Mock 5% daily change
  const dailyChangePercent = -5.00; // Mock percentage

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#990022] to-[#220099] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Button
          variant="outline"
          size="sm"
          className="text-white border-white/30 hover:bg-white/10"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="text-xl font-semibold">Lorem Ipsum</h1>
          <p className="text-white/70 text-sm">lipsum00@gmail.com</p>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <User size={20} weight="fill" />
        </div>
      </div>

      {/* Balance Section - LENZ Token Balance */}
      <div className="text-center px-6 mb-8">
        <div className="mb-2">
          <div className="text-sm text-white/70 mb-1">LENZ Balance</div>
          <div className="text-2xl font-medium text-white/90">{lenzBalance.toFixed(5)} LENZ</div>
        </div>
        <h2 className="text-4xl font-bold mb-2">${lenzValueUSD.toFixed(2)}</h2>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-red-400">-${Math.abs(dailyChange).toFixed(2)}</span>
          <span className="text-red-400">{dailyChangePercent.toFixed(2)}%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-4 px-6 mb-8">
        <Button
          variant="outline"
          className={`flex flex-col items-center gap-2 h-20 border-white/20 hover:bg-white/20 transition-all duration-200 ${
            copied ? 'bg-green-500/20 border-green-400/50' : 'bg-white/10'
          }`}
          onClick={copyWalletAddress}
        >
          <Wallet size={24} className={copied ? 'text-green-400' : ''} />
          <span className={`text-xs ${copied ? 'text-green-400' : ''}`}>
            {copied ? 'Copied!' : 'Receive'}
          </span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-20 bg-white/10 border-white/20 hover:bg-white/20"
        >
          <PaperPlaneTilt size={24} />
          <span className="text-xs">Send</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-20 bg-white/10 border-white/20 hover:bg-white/20"
        >
          <ArrowsClockwise size={24} />
          <span className="text-xs">Swap</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-20 bg-white/10 border-white/20 hover:bg-white/20"
        >
          <CurrencyDollar size={24} />
          <span className="text-xs">Buy</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 px-6 mb-6">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`text-lg font-medium pb-2 border-b-2 transition-colors ${
            activeTab === 'tokens' 
              ? 'text-white border-white' 
              : 'text-white/60 border-transparent hover:text-white/80'
          }`}
        >
          Tokens
        </button>
        <button
          onClick={() => setActiveTab('lenses')}
          className={`text-lg font-medium pb-2 border-b-2 transition-colors ${
            activeTab === 'lenses' 
              ? 'text-white border-white' 
              : 'text-white/60 border-transparent hover:text-white/80'
          }`}
        >
          My Lenses
        </button>
      </div>

      {/* Content */}
      <div className="px-6 space-y-4">
        {activeTab === 'tokens' && (
          <>
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    {token.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{token.name}</h3>
                    <p className={`text-sm ${token.changeColor}`}>{token.change}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{token.balance} {token.symbol}</p>
                  <p className="text-sm text-white/70">{token.value}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'lenses' && (
          <>
            {isLoadingLenses ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/70">Loading your lenses...</p>
              </div>
            ) : userLenses.length > 0 ? (
              userLenses.map((lens) => (
                <div
                  key={lens.id}
                  className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {lens.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{lens.name}</h3>
                      <p className="text-sm text-white/70">{lens.creator}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      Owned
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Coins size={48} className="mx-auto mb-4 text-white/50" />
                <p className="text-white/70 mb-2">No lenses purchased yet</p>
                <p className="text-white/50 text-sm">
                  Visit the camera to try and purchase AR lenses
                </p>
                <Button
                  variant="outline"
                  className="mt-4 border-white/30 text-white hover:bg-white/10"
                  onClick={() => router.push('/')}
                >
                  Browse Lenses
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}