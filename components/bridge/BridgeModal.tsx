'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLenzWallet } from '../../providers/LenzWalletProvider';
import { squidBridgeService, type BridgeFeeEstimate, type BridgeTransactionResult } from '@/lib/squid-bridge';
import { ethers } from 'ethers';
import { 
  ArrowRightLeft, 
  Wallet, 
  Clock, 
  DollarSign, 
  Zap,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface BridgeModalProps {
  children: React.ReactNode;
}

export function BridgeModal({ children }: BridgeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [bridgeStep, setBridgeStep] = useState<'input' | 'confirm' | 'executing' | 'tracking'>('input');
  const [bridgeTransaction, setBridgeTransaction] = useState<BridgeTransactionResult | null>(null);
  const [trackingProgress, setTrackingProgress] = useState(0);

  const { wallet } = useLenzWallet();
  const { toast } = useToast();

  // Calculate bridge fees
  const { data: feeEstimate, isLoading: isCalculatingFees, error: feeError } = useQuery({
    queryKey: ['bridge-fees', amount, wallet?.address],
    queryFn: async () => {
      if (!amount || !wallet?.address || parseFloat(amount) <= 0) return null;
      const amountWei = ethers.parseEther(amount).toString();
      return squidBridgeService.calculateBridgeFees(amountWei, wallet.address);
    },
    enabled: !!amount && !!wallet?.address && parseFloat(amount) > 0,
    retry: 1,
  });

  // Execute bridge transaction
  const bridgeMutation = useMutation({
    mutationFn: async () => {
      if (!wallet?.address || !amount || !feeEstimate) {
        throw new Error('Missing required data for bridge transaction');
      }

      const amountWei = ethers.parseEther(amount).toString();
      const route = await squidBridgeService.getBridgeRoute({
        amount: amountWei,
        fromAddress: wallet.address,
        toAddress: wallet.address, // Same address on destination
      });

      // Mock signer for demonstration - replace with actual wallet signer
      const provider = new ethers.JsonRpcProvider('https://rpc.saga.money'); // Saga RPC
      const signer = new ethers.Wallet('0x' + '0'.repeat(64), provider); // Replace with actual wallet

      return squidBridgeService.executeBridge(route.route, signer);
    },
    onSuccess: (result) => {
      setBridgeTransaction(result);
      setBridgeStep('tracking');
      toast({
        title: "Bridge Transaction Initiated",
        description: `Your bridge transaction has been submitted. Track progress below.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bridge Failed",
        description: error.message || "Failed to execute bridge transaction",
        variant: "destructive",
      });
      setBridgeStep('input');
    },
  });

  // Track bridge progress
  useEffect(() => {
    if (bridgeStep !== 'tracking' || !bridgeTransaction) return;

    const trackProgress = async () => {
      try {
        const status = await squidBridgeService.getTransactionStatus(bridgeTransaction.routeRequestId);
        
        // Update progress based on status
        if (status.fromChain.status === 'success' && !status.toChain.status) {
          setTrackingProgress(50);
        } else if (status.toChain.status === 'success') {
          setTrackingProgress(100);
          toast({
            title: "Bridge Complete!",
            description: "Your LENZ tokens have been successfully bridged to Base.",
          });
        } else if (status.status === 'failed' || status.error) {
          toast({
            title: "Bridge Failed",
            description: status.error || "Bridge transaction failed",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to track bridge progress:', error);
      }
    };

    const interval = setInterval(trackProgress, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [bridgeStep, bridgeTransaction, toast]);

  const handleAmountChange = (value: string) => {
    // Only allow valid decimal numbers
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const getMaxBridgeAmount = () => {
    if (!wallet?.balance) return '0';
    const balance = parseFloat(wallet.balance);
    // Reserve some for gas fees
    return Math.max(0, balance - 0.001).toString();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `~${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  const resetModal = () => {
    setAmount('');
    setBridgeStep('input');
    setBridgeTransaction(null);
    setTrackingProgress(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft size={20} />
            Bridge LENZ Tokens
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bridge Route Visualization */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="font-medium">Saga Chainlet</div>
              <div className="text-sm text-muted-foreground">LENZ</div>
            </div>
            <ChevronRight className="text-muted-foreground" size={20} />
            <div className="text-center">
              <div className="font-medium">Base Network</div>
              <div className="text-sm text-muted-foreground">USDC</div>
            </div>
          </div>

          {bridgeStep === 'input' && (
            <>
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="bridge-amount">Amount to Bridge</Label>
                <div className="relative">
                  <Input
                    id="bridge-amount"
                    type="text"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pr-20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">LENZ</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(getMaxBridgeAmount())}
                      className="h-6 px-2 text-xs"
                    >
                      MAX
                    </Button>
                  </div>
                </div>
                {wallet?.balance && (
                  <div className="text-sm text-muted-foreground">
                    Balance: {parseFloat(wallet.balance).toFixed(5)} LENZ
                  </div>
                )}
              </div>

              {/* Fee Estimate */}
              {amount && parseFloat(amount) > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Bridge Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isCalculatingFees ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="ml-2 text-sm">Calculating fees...</span>
                      </div>
                    ) : feeEstimate ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">You'll send:</span>
                          <span className="font-medium">{amount} LENZ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">You'll receive:</span>
                          <span className="font-medium">
                            ~{parseFloat(ethers.formatEther(feeEstimate.estimatedOutput)).toFixed(6)} USDC
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bridge fee:</span>
                          <span>${parseFloat(ethers.formatEther(feeEstimate.bridgeFee || '0')).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gas fee:</span>
                          <span>${parseFloat(ethers.formatEther(feeEstimate.gasFee)).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated time:</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(feeEstimate.estimatedTime)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Slippage:</span>
                          <span>{(feeEstimate.slippage * 100).toFixed(2)}%</span>
                        </div>
                      </>
                    ) : feeError ? (
                      <div className="text-center py-4 text-destructive text-sm">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                        Unable to calculate fees. Please try again.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {/* Bridge Button */}
              <Button
                onClick={() => setBridgeStep('confirm')}
                disabled={!amount || parseFloat(amount) <= 0 || isCalculatingFees || !feeEstimate}
                className="w-full"
                size="lg"
              >
                <Zap size={16} className="mr-2" />
                Review Bridge Transaction
              </Button>
            </>
          )}

          {bridgeStep === 'confirm' && feeEstimate && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Confirm Bridge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Bridging:</span>
                      <span className="font-bold">{amount} LENZ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To receive:</span>
                      <span className="font-bold">
                        ~{parseFloat(ethers.formatEther(feeEstimate.estimatedOutput)).toFixed(6)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total fees:</span>
                      <span>
                        ${(parseFloat(ethers.formatEther(feeEstimate.bridgeFee || '0')) + 
                          parseFloat(ethers.formatEther(feeEstimate.gasFee))).toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle size={14} className="inline mr-1" />
                    This transaction will bridge your LENZ tokens to USDC on Base network. 
                    The process typically takes {formatTime(feeEstimate.estimatedTime)} to complete.
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setBridgeStep('input')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setBridgeStep('executing');
                        bridgeMutation.mutate();
                      }}
                      disabled={bridgeMutation.isPending}
                      className="flex-1"
                    >
                      {bridgeMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="mr-2" />
                          Execute Bridge
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {bridgeStep === 'executing' && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Executing Bridge</h3>
                <p className="text-muted-foreground text-center">
                  Please confirm the transaction in your wallet...
                </p>
              </CardContent>
            </Card>
          )}

          {bridgeStep === 'tracking' && bridgeTransaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} />
                  Bridge in Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{trackingProgress}%</span>
                  </div>
                  <Progress value={trackingProgress} className="w-full" />
                </div>

                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Transaction submitted to Saga</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trackingProgress >= 50 ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <Loader2 size={14} className="animate-spin text-muted-foreground" />
                    )}
                    <span>Bridging to Base network</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trackingProgress >= 100 ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground border-dashed" />
                    )}
                    <span>Tokens received on Base</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (bridgeTransaction.transactionHash) {
                        window.open(`https://sagascan.io/tx/${bridgeTransaction.transactionHash}`, '_blank');
                      }
                    }}
                  >
                    <ExternalLink size={14} className="mr-2" />
                    View on Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}