'use client';

import { useQuery } from '@tanstack/react-query';
import { Lens, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { X, User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SnapSidebarProps {
  open: boolean;
  onClose: () => void;
  onSelectLens: (lens: Lens) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function SnapSidebar({ 
  open, 
  onClose, 
  onSelectLens, 
  user, 
  onLogin, 
  onLogout 
}: SnapSidebarProps) {
  const { data: lenses = [] } = useQuery<Lens[]>({
    queryKey: ['/api/lenses'],
    queryFn: () => apiRequest('/api/lenses')
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-0 h-full w-80 bg-gray-900 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-white text-xl font-semibold">Lenz</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Section */}
            <div className="p-6 border-b border-gray-700">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white font-medium">{user.username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={onLogin}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>

            {/* Lens Collection */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Available Lenses</h3>
              <div className="space-y-3">
                {lenses.map((lens) => (
                  <motion.div
                    key={lens.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectLens(lens);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {lens.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{lens.name}</h4>
                        <p className="text-gray-400 text-sm">{lens.description}</p>
                        <p className="text-gray-500 text-xs mt-1">by {lens.creator}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}