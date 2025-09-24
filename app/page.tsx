'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Lens } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import SnapCameraView from '../components/snap-ui/SnapCameraView';
import { SnapSidebar } from '../components/snap-ui/SnapSidebar';
import { useWeb3 } from '../hooks/useWeb3';
import { BalanceDisplay } from '../components/web3/BalanceDisplay';

export default function HomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Web3 functionality
  const {
    account,
    wsStatus,
    isAuthenticated,
    balances,
    isLoadingBalances,
    isTransferring,
    connectWallet,
    handleSupport,
    formatAddress,
  } = useWeb3();
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLens, setSelectedLens] = useState<Lens | null>(null);
  
  // Fetch user data
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/user');
      } catch (error) {
        // User is not logged in, which is fine
        return null;
      }
    }
  });
  
  // Handle login - for now just show notification
  const handleLogin = () => {
    setSidebarOpen(false);
    toast({
      title: "Login",
      description: "Login functionality coming soon!",
    });
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest('/api/logout', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setSidebarOpen(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out.",
        variant: "destructive"
      });
    }
  };
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  // Handle lens selection
  const handleSelectLens = (lens: Lens) => {
    setSelectedLens(lens);
  };
  
  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-black flex flex-col">
      {/* Main camera view */}
      <div className="flex-1 relative">
        <SnapCameraView
          defaultLensId={selectedLens?.id}
          onOpenSidebar={toggleSidebar}
          // Web3 props
          account={account}
          wsStatus={wsStatus}
          isAuthenticated={isAuthenticated}
          balances={balances}
          isLoadingBalances={isLoadingBalances}
          isTransferring={isTransferring}
          connectWallet={connectWallet}
          handleSupport={handleSupport}
          formatAddress={formatAddress}
        />
      </div>
      
      {/* Sidebar for lens selection and menu */}
      <SnapSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectLens={handleSelectLens}
        user={user ?? null}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
}