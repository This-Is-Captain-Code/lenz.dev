'use client';

import React, { useState } from 'react';
import { useLenzWallet } from '../../providers/LenzWalletProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Copy, Download, ExternalLink, Wallet, Plus, Import, LogOut } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Badge } from '../ui/badge';

interface LenzWalletModalProps {
  children: React.ReactNode;
}

export function LenzWalletModal({ children }: LenzWalletModalProps) {
  const { 
    wallet, 
    isLoading, 
    error, 
    createWallet, 
    importWallet, 
    disconnectWallet,
    getBalance,
    addToMetaMask,
    exportPrivateKey,
    chainConfig
  } = useLenzWallet();
  
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleCreateWallet = async () => {
    try {
      await createWallet();
      toast({
        title: "LenZ Wallet Created!",
        description: "Your new LenZ chainlet wallet is ready to use.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to create wallet",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleImportWallet = async () => {
    if (!importKey.trim()) {
      toast({
        title: "Invalid private key",
        description: "Please enter a valid private key",
        variant: "destructive"
      });
      return;
    }

    try {
      await importWallet(importKey.trim());
      setImportKey('');
      toast({
        title: "Wallet Imported!",
        description: "Your LenZ wallet has been imported successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleCopyPrivateKey = () => {
    const privateKey = exportPrivateKey();
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      toast({
        title: "Private key copied",
        description: "Keep this secure and never share it!",
      });
    }
  };

  const handleAddToMetaMask = async () => {
    try {
      await addToMetaMask();
      toast({
        title: "Network added",
        description: "LenZ Chainlet added to MetaMask successfully",
      });
    } catch (err: any) {
      toast({
        title: "Failed to add network",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await getBalance();
      toast({
        title: "Balance updated",
        description: "Wallet balance has been refreshed",
      });
    } catch (err: any) {
      toast({
        title: "Failed to refresh",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            LenZ Chainlet Wallet
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!wallet ? (
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="import">Import Existing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Create LenZ Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate a new wallet specifically for the LenZ chainlet ecosystem
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">LenZ Chainlet Features:</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                    <li>• Native LENZ token support</li>
                    <li>• Optimized for AR photo NFTs</li>
                    <li>• Low gas fees</li>
                    <li>• Dedicated ecosystem</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleCreateWallet} 
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Create LenZ Wallet'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Import Existing Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Import an existing wallet using your private key
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="private-key">Private Key</Label>
                  <Input
                    id="private-key"
                    type="password"
                    placeholder="Enter your private key..."
                    value={importKey}
                    onChange={(e) => setImportKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your private key is stored locally and never shared
                  </p>
                </div>

                <Button 
                  onClick={handleImportWallet} 
                  disabled={isLoading || !importKey.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Import className="h-4 w-4 mr-2" />
                  {isLoading ? 'Importing...' : 'Import Wallet'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Connected to LenZ Chainlet</span>
              </div>
              <Badge variant="secondary">LENZ</Badge>
            </div>

            {/* Wallet Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={wallet.address} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyAddress}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Balance</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefreshBalance}
                  >
                    Refresh
                  </Button>
                </div>
                <div className="text-2xl font-bold">
                  {wallet.balance} LENZ
                </div>
              </div>
            </div>

            {/* Chain Info */}
            <div className="space-y-2">
              <Label>Network Details</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Chain ID</p>
                  <p className="font-mono">{chainConfig.chainId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Currency</p>
                  <p>{chainConfig.nativeCurrency.symbol}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleAddToMetaMask}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Add to MetaMask
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {showPrivateKey ? 'Hide' : 'Show'} Key
                </Button>
              </div>

              {showPrivateKey && (
                <div className="space-y-2">
                  <Label>Private Key (Keep Secret!)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={exportPrivateKey() || ''} 
                      readOnly 
                      type="password"
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyPrivateKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    ⚠️ Never share your private key with anyone
                  </p>
                </div>
              )}

              <Button 
                variant="destructive" 
                onClick={disconnectWallet}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}