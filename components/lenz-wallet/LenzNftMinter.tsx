'use client';

import React, { useState } from 'react';
import { useLenzWallet } from '../../providers/LenzWalletProvider';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { Sparkles, Upload } from 'lucide-react';

interface LenzNftMinterProps {
  imageUrl: string;
  metadata?: {
    name?: string;
    description?: string;
    lens?: string;
  };
}

export function LenzNftMinter({ imageUrl, metadata }: LenzNftMinterProps) {
  const { wallet, isLoading, sendTransaction } = useLenzWallet();
  const { toast } = useToast();
  const [isMinting, setIsMinting] = useState(false);

  const handleMintOnLenzChain = async () => {
    if (!wallet) {
      toast({
        title: "Wallet Required",
        description: "Please create or connect a LenZ wallet first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsMinting(true);

      // First, copy image to clipboard for easy upload
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);

      // For now, open a general NFT minting service that supports custom chains
      // In production, you'd integrate with a LenZ-specific NFT contract
      const mintingUrl = `https://opensea.io/get-featured?ref=lenzdev`;
      
      // Alternative: could integrate with a custom LenZ NFT contract
      // const contractAddress = "0x..."; // Your LenZ NFT contract
      // const tx = await sendTransaction(contractAddress, "0"); // Call mint function
      
      window.open(mintingUrl, '_blank');

      toast({
        title: "Ready to Mint on LenZ Chain!",
        description: "Image copied to clipboard. Choose 'Custom Network' and add LenZ Chainlet details.",
      });

    } catch (error: any) {
      console.error('LenZ NFT minting error:', error);
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to prepare for LenZ NFT minting",
        variant: "destructive"
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white hover:bg-orange-500/20 w-12 h-12 border border-orange-400/30"
      onClick={handleMintOnLenzChain}
      disabled={isLoading || isMinting}
      title="Mint NFT on LenZ Chainlet"
    >
      {isMinting ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-400"></div>
      ) : (
        <Upload className="h-6 w-6 text-orange-400" />
      )}
    </Button>
  );
}