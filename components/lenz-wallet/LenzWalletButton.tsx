'use client';

import React from 'react';
import { useLenzWallet } from '../../providers/LenzWalletProvider';
import { LenzWalletModal } from './LenzWalletModal';
import { Button } from '../ui/button';
import { Wallet, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';

interface LenzWalletButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function LenzWalletButton({ 
  variant = 'outline', 
  size = 'default',
  className = ''
}: LenzWalletButtonProps) {
  const { wallet, isLoading } = useLenzWallet();

  if (!wallet) {
    return (
      <LenzWalletModal>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create LenZ Wallet
        </Button>
      </LenzWalletModal>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num < 0.001) return '< 0.001';
    return num.toFixed(3);
  };

  return (
    <LenzWalletModal>
      <Button 
        variant={variant} 
        size={size}
        className={`${className} relative`}
      >
        <Wallet className="h-4 w-4 mr-2" />
        <div className="flex flex-col items-start text-left">
          <span className="text-xs opacity-70">LenZ</span>
          <span className="font-mono text-sm">{formatAddress(wallet.address)}</span>
        </div>
        <Badge variant="secondary" className="ml-2 text-xs">
          {formatBalance(wallet.balance)} LENZ
        </Badge>
      </Button>
    </LenzWalletModal>
  );
}