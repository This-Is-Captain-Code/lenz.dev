'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface RewardStats {
  totalDistributions: number;
  totalRewardsDistributed: number;
  activeCreators: number;
  lastDistributionDate: string | null;
}

interface RewardDistribution {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalRewardPool: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  createdAt: string;
  completedAt?: string;
}

interface CreatorReward {
  id: string;
  creatorAddress: string;
  creatorName: string;
  interactionCount: number;
  rewardWeight: string;
  rewardAmount: string;
  transactionHash?: string;
  status: 'pending' | 'sent' | 'failed';
}

export function RewardsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch reward status and stats
  const { data: rewardData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['/api/rewards/status'],
    queryFn: () => apiRequest('/api/rewards/status'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual distribution trigger
  const distributeMutation = useMutation({
    mutationFn: () => apiRequest('/api/rewards/distribute', {
      method: 'POST',
    }),
    onSuccess: (data) => {
      toast({
        title: "Distribution Started",
        description: `Weekly reward distribution initiated successfully. Distribution ID: ${data.distributionId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Distribution Failed",
        description: error.message || "Failed to start reward distribution",
        variant: "destructive",
      });
    },
  });

  const stats: RewardStats = rewardData?.stats || {
    totalDistributions: 0,
    totalRewardsDistributed: 0,
    activeCreators: 0,
    lastDistributionDate: null,
  };

  const latestDistribution: RewardDistribution | null = rewardData?.latestDistribution || null;
  const latestCreatorRewards: CreatorReward[] = rewardData?.latestCreatorRewards || [];
  const recentDistributions: RewardDistribution[] = rewardData?.recentDistributions || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      processing: { variant: 'default' as const, icon: AlertCircle, color: 'text-blue-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      failed: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      sent: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={12} className={config.color} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount.toString()));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rewards Dashboard</h1>
          <p className="text-muted-foreground">
            Manage weekly creator reward distributions based on lens interactions
          </p>
        </div>
        <Button
          onClick={() => distributeMutation.mutate()}
          disabled={distributeMutation.isPending}
          className="flex items-center gap-2"
        >
          <Play size={16} />
          {distributeMutation.isPending ? 'Processing...' : 'Distribute Rewards'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRewardsDistributed)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalDistributions} distributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCreators}</div>
            <p className="text-xs text-muted-foreground">
              In latest distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Pool</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestDistribution ? formatCurrency(latestDistribution.totalRewardPool) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current distribution amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Distribution</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastDistributionDate 
                ? formatDate(stats.lastDistributionDate).split(',')[0]
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {latestDistribution ? getStatusBadge(latestDistribution.status) : 'No distributions yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View */}
      <Tabs defaultValue="latest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="latest">Latest Distribution</TabsTrigger>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
        </TabsList>

        <TabsContent value="latest" className="space-y-4">
          {latestDistribution ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Distribution Details
                    {getStatusBadge(latestDistribution.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Week Period</p>
                      <p className="text-muted-foreground">
                        {formatDate(latestDistribution.weekStart)} - {formatDate(latestDistribution.weekEnd)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Total Pool</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(latestDistribution.totalRewardPool)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-muted-foreground">
                        {formatDate(latestDistribution.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Transaction</p>
                      <p className="text-muted-foreground">
                        {latestDistribution.transactionHash 
                          ? `${latestDistribution.transactionHash.slice(0, 8)}...`
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Creator Rewards ({latestCreatorRewards.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {latestCreatorRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{reward.creatorName}</div>
                          <div className="text-sm text-muted-foreground">
                            {reward.interactionCount} interactions • {(parseFloat(reward.rewardWeight) * 100).toFixed(2)}% weight
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reward.creatorAddress.slice(0, 8)}...{reward.creatorAddress.slice(-6)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(reward.rewardAmount)}</div>
                          {getStatusBadge(reward.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Distributions Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start your first weekly reward distribution to see creator rewards here.
                </p>
                <Button
                  onClick={() => distributeMutation.mutate()}
                  disabled={distributeMutation.isPending}
                >
                  Start First Distribution
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Distributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDistributions.length > 0 ? (
                  recentDistributions.map((distribution) => (
                    <div
                      key={distribution.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {formatDate(distribution.weekStart)} - {formatDate(distribution.weekEnd)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created {formatDate(distribution.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(distribution.totalRewardPool)}</div>
                        {getStatusBadge(distribution.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No distribution history available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}