'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Camera, Sparkles, Download, User } from 'lucide-react';
import { Lens } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stats' | 'lenses'>('stats');
  
  // Fetch user's purchased lenses
  const { data: userLenses = [], isLoading: isLoadingUserLenses } = useQuery<Lens[]>({
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

  // Fetch all available lenses for stats
  const { data: allLenses = [] } = useQuery<Lens[]>({
    queryKey: ['/api/lenses'],
    queryFn: async () => await apiRequest('/api/lenses')
  });

  const stats = [
    {
      label: 'Available Lenses',
      value: allLenses.length,
      icon: Camera,
      color: 'text-blue-400'
    },
    {
      label: 'Your Lenses',
      value: userLenses.length,
      icon: Sparkles,
      color: 'text-purple-400'
    },
    {
      label: 'Photos Captured',
      value: '0', // Could be tracked in local storage if needed
      icon: Download,
      color: 'text-green-400'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="text-white hover:bg-gray-800"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-semibold" data-testid="text-title">Dashboard</h1>
          
          <div className="w-10 h-10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* App Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-300">App Statistics</h2>
          <div className="grid grid-cols-1 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-800"
                data-testid={`card-stat-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-800`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold" data-testid={`text-stat-${index}`}>{stat.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('stats')}
              className="flex-1"
              data-testid="button-tab-stats"
            >
              App Info
            </Button>
            <Button
              variant={activeTab === 'lenses' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('lenses')}
              className="flex-1"
              data-testid="button-tab-lenses"
            >
              My Lenses
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-medium mb-4">About LenZ Camera</h3>
                <div className="space-y-3 text-gray-300">
                  <p>LenZ Camera is an AR camera app that lets you capture stunning photos using Snapchat lenses.</p>
                  <p>Explore different lenses, capture amazing photos, and share them with your friends on social media.</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary">AR Camera</Badge>
                    <Badge variant="secondary">Snapchat Lenses</Badge>
                    <Badge variant="secondary">Photo Sharing</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lenses' && (
            <div className="space-y-4">
              {isLoadingUserLenses ? (
                <div className="text-center py-8 text-gray-400">
                  Loading your lenses...
                </div>
              ) : userLenses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No lenses found</p>
                  <p className="text-sm">Start using lenses in the camera to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {userLenses.map((lens) => (
                    <div 
                      key={lens.id}
                      className="bg-gray-900/50 rounded-xl p-4 border border-gray-800"
                      data-testid={`card-lens-${lens.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium" data-testid={`text-lens-name-${lens.id}`}>{lens.name}</h4>
                          <p className="text-sm text-gray-400">by {lens.creator}</p>
                          {lens.description && (
                            <p className="text-sm text-gray-500 mt-1">{lens.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {lens.category || 'General'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}