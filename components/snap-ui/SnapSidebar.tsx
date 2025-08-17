import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lens, User } from '@shared/schema';
import { X, MagnifyingGlass, Check } from '@phosphor-icons/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);

  // Fetch all lenses
  const { data: lenses = [], isLoading } = useQuery<Lens[]>({
    queryKey: ['/api/lenses'],
  });

  // Filter lenses based on search and category
  const filteredLenses = lenses.filter(lens => {
    const matchesSearch = lens.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lens.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || lens.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Categories
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'portrait', name: 'Portrait' },
    { id: 'beauty', name: 'Beauty' },
    { id: 'creative', name: 'Creative' },
  ];

  // Handle lens selection
  const handleSelectLens = (lens: Lens) => {
    setSelectedLensId(lens.id);
    onSelectLens(lens);
  };

  // Lens preview images (mock data for design purposes)
  const getLensPreviewImage = (lens: Lens) => {
    const images = {
      '1': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&w=400&h=400&fit=crop',
      '2': 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?ixlib=rb-4.0.3&w=400&h=400&fit=crop',
      '3': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=400&h=400&fit=crop',
      '4': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&w=400&h=400&fit=crop',
      '5': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=400&h=400&fit=crop',
      '6': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?ixlib=rb-4.0.3&w=400&h=400&fit=crop',
    };
    return images[lens.id as keyof typeof images] || images['1'];
  };

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
            data-testid="overlay-sidebar-backdrop"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-80 bg-surface/95 backdrop-blur-xl border-l border-white/10"
            data-testid="sidebar-lens-gallery"
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white" data-testid="text-sidebar-title">Lens Gallery</h2>
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={onClose}
                    data-testid="button-close-sidebar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search lenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-primary"
                    data-testid="input-search-lenses"
                  />
                </div>
              </div>
              
              {/* Lens Categories */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex space-x-2 overflow-x-auto">
                  {categories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      size="sm"
                      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                        selectedCategory === category.id 
                          ? 'bg-primary text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                      data-testid={`button-category-${category.id}`}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Lens Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredLenses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400" data-testid="text-no-lenses">No lenses found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredLenses.map(lens => (
                      <div 
                        key={lens.id} 
                        className="relative group cursor-pointer"
                        onClick={() => handleSelectLens(lens)}
                        data-testid={`card-lens-${lens.id}`}
                      >
                        <div className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                          selectedLensId === lens.id 
                            ? 'border-primary' 
                            : 'border-white/20 hover:border-white/40'
                        }`}>
                          <img 
                            src={getLensPreviewImage(lens)}
                            alt={`${lens.name} lens preview`} 
                            className="w-full h-full object-cover"
                            data-testid={`img-lens-preview-${lens.id}`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="text-xs font-medium text-white" data-testid={`text-lens-name-${lens.id}`}>
                                {lens.name}
                              </div>
                              <div className="text-xs text-gray-300" data-testid={`text-lens-downloads-${lens.id}`}>
                                {lens.downloads?.toLocaleString() || 0} downloads
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {selectedLensId === lens.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* User Profile Section */}
              <div className="p-6 border-t border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.username?.[0]?.toUpperCase() || 'G'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white" data-testid="text-user-name">
                      {user?.username || 'Guest User'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {user ? 'Signed in' : 'Sign in to save lenses'}
                    </div>
                  </div>
                </div>
                
                {user ? (
                  <Button 
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10"
                    onClick={onLogout}
                    data-testid="button-logout"
                  >
                    Sign Out
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/80"
                    onClick={onLogin}
                    data-testid="button-login"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}