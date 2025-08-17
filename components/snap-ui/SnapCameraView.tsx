'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lens, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { applyLensToCanvas, captureCanvas, initializeCamera } from '@/lib/cameraKitService';
import { useToast } from '@/hooks/use-toast';
import { Camera, Repeat, Download, Info, X, ChevronUp, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SnapCameraViewProps {
  defaultLensId?: string;
  userLensesOnly?: boolean;
  onOpenSidebar?: () => void;
}

export default function SnapCameraView({ 
  defaultLensId, 
  userLensesOnly = false,
  onOpenSidebar
}: SnapCameraViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // State
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [currentLensIndex, setCurrentLensIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showLensInfo, setShowLensInfo] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  // Animation states
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  // Fetch lenses
  const { data: allLenses = [], isLoading: isLoadingLenses } = useQuery<Lens[]>({
    queryKey: ['/api/lenses'],
    queryFn: async () => await apiRequest('/api/lenses')
  });
  
  // Fetch user's purchased lenses if needed
  const { data: userLenses = [], isLoading: isLoadingUserLenses } = useQuery<Lens[]>({
    queryKey: ['/api/my-lenses'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/my-lenses');
        return result.map((ul: any) => ul.lens);
      } catch (error) {
        return [];
      }
    },
    enabled: userLensesOnly
  });
  
  // Determine which lenses to use
  const lenses = userLensesOnly ? userLenses : allLenses;
  
  // Set initial lens index based on defaultLensId
  useEffect(() => {
    if (defaultLensId && lenses.length > 0) {
      const index = lenses.findIndex(lens => lens.id === defaultLensId);
      if (index >= 0) {
        setCurrentLensIndex(index);
      }
    }
  }, [defaultLensId, lenses]);
  
  // Current lens
  const currentLens = lenses[currentLensIndex];
  
  // Initialize camera when component mounts
  useEffect(() => {
    if (canvasRef.current && !isCameraReady) {
      initializeCamera({
        canvas: canvasRef.current,
        facingMode
      })
        .then((stream) => {
          console.log('Camera initialized successfully');
          setMediaStream(stream);
          setIsCameraReady(true);
        })
        .catch((error) => {
          console.error('Failed to initialize camera:', error);
          toast({
            title: "Camera Error",
            description: "Failed to initialize camera. Please check permissions.",
            variant: "destructive"
          });
        });
    }
  }, [facingMode, isCameraReady, toast]);
  
  // Apply lens when current lens changes
  useEffect(() => {
    if (isCameraReady && canvasRef.current && currentLens) {
      console.log('Applying lens:', currentLens.name);
      console.log('Lens details:', {
        id: currentLens.id,
        snapLensId: currentLens.snapLensId,
        groupId: currentLens.snapGroupId,
        name: currentLens.name
      });
      
      applyLensToCanvas(canvasRef.current, currentLens.snapLensId, currentLens.snapGroupId)
        .then(() => {
          console.log('Successfully applied lens:', currentLens.name);
        })
        .catch((error) => {
          console.error('Failed to apply lens:', error);
          console.error('Error applying lens details:', {
            lensName: currentLens.name,
            snapLensId: currentLens.snapLensId,
            groupId: currentLens.snapGroupId,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
          toast({
            title: "Lens Error",
            description: `Failed to apply lens: ${currentLens.name}`,
            variant: "destructive"
          });
        });
    }
  }, [currentLens, isCameraReady, toast]);
  
  // Switch between front and back camera
  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setIsCameraReady(false);
  };
  
  // Change lens
  const changeLens = (direction: 'prev' | 'next') => {
    if (lenses.length === 0) return;
    
    setCurrentLensIndex(prevIndex => {
      if (direction === 'next') {
        return (prevIndex + 1) % lenses.length;
      } else {
        return prevIndex === 0 ? lenses.length - 1 : prevIndex - 1;
      }
    });
  };
  
  // Capture photo
  const handleCapture = async () => {
    if (!canvasRef.current) return;
    
    try {
      const dataUrl = await captureCanvas(canvasRef.current);
      setCapturedPhoto(dataUrl);
      
      toast({
        title: "Photo Captured!",
        description: "Your photo has been captured successfully.",
      });
    } catch (error) {
      console.error('Failed to capture photo:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle touch events for lens switching
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const deltaY = currentTouch.clientY - startY;
      const progress = Math.abs(deltaY) / 100;
      
      if (Math.abs(deltaY) > 10) {
        setSwipeDirection(deltaY > 0 ? 'down' : 'up');
        setSwipeProgress(Math.min(progress, 1));
      }
    };
    
    const handleTouchEnd = () => {
      if (swipeProgress > 0.3) {
        if (swipeDirection === 'up') {
          changeLens('next');
        } else if (swipeDirection === 'down') {
          changeLens('prev');
        }
      }
      
      setSwipeDirection(null);
      setSwipeProgress(0);
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [showControls]);

  // Show controls when user interacts
  const showControlsTemporary = () => {
    setShowControls(true);
  };

  // Download photo function
  const downloadPhoto = () => {
    if (capturedPhoto) {
      const a = document.createElement('a');
      a.href = capturedPhoto;
      a.download = `lens-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Photo Downloaded",
        description: "Your photo has been saved to your device.",
      });
    }
  };

  // Share to Twitter function
  const shareToTwitter = () => {
    if (capturedPhoto) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'lens-photo.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
              navigator.share({
                text: 'Captured using @lenzdotdev',
                files: [file]
              }).catch(console.error);
            } else {
              const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Captured using @lenzdotdev')}`;
              window.open(twitterUrl, '_blank');
            }
          }
        }, 'image/png');
      };
      
      img.src = capturedPhoto;
    }
  };

  // Back to camera function
  const backToCamera = () => {
    setCapturedPhoto(null);
  };

  // Get visible lenses for carousel
  const getVisibleLenses = () => {
    const visibleCount = 5;
    const result = [];
    
    for (let i = -2; i <= 2; i++) {
      let index = currentLensIndex + i;
      if (index < 0) index = lenses.length + index;
      if (index >= lenses.length) index = index - lenses.length;
      
      result.push({
        lens: lenses[index],
        offset: i,
        index: index
      });
    }
    
    return result;
  };

  // Captured photo view
  if (capturedPhoto) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col">
        {/* Top Bar with Profile and Help Icons */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 w-12 h-12 rounded-full"
            onClick={onOpenSidebar}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 w-12 h-12 rounded-full"
            onClick={backToCamera}
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Main Photo Container - Centered between top and share sections */}
        <div className="flex-1 p-4 pt-20 pb-28 flex items-center justify-center">
          <div className="relative w-full max-w-sm mx-auto">
            {/* Photo with exact 9:16 aspect ratio */}
            <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden border-2 border-white">
              <img 
                src={capturedPhoto} 
                alt="Captured photo" 
                className="w-full h-full object-cover"
              />
              
              {/* Lens name overlay - top left */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-white text-sm font-medium">
                  {currentLens?.name || 'Lens'}
                </span>
              </div>
              
              {/* Attribution - bottom left */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
                <div className="text-white text-sm">
                  <span className="font-medium">@waszim</span>
                  <div className="text-white/70 text-xs">1 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Share Section - Positioned same height as lens carousel */}
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 max-w-sm mx-auto">
            <div className="flex justify-center gap-6">
              {/* X/Twitter */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-12 h-12"
                onClick={shareToTwitter}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Button>
              
              {/* Instagram */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-12 h-12"
                onClick={() => {
                  navigator.clipboard.writeText('Captured using @lenzdotdev').then(() => {
                    toast({
                      title: "Ready for Instagram!",
                      description: "Text copied. Save the photo and post to Instagram.",
                    });
                  });
                  downloadPhoto();
                }}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Button>
              
              {/* Facebook */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-12 h-12"
                onClick={() => {
                  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent('Captured using @lenzdotdev')}`;
                  window.open(fbUrl, '_blank');
                }}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Button>
              
              {/* LinkedIn */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-12 h-12"
                onClick={() => {
                  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                  window.open(linkedinUrl, '_blank');
                }}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Button>
              
              {/* Reddit */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-12 h-12"
                onClick={() => {
                  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent('Captured using @lenzdotdev')}`;
                  window.open(redditUrl, '_blank');
                }}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onClick={showControlsTemporary}
    >
      {/* Camera Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
      />
      
      {/* Loading Overlay */}
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Initializing Camera...</p>
          </div>
        </div>
      )}
      
      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-10 p-4"
          >
            <div className="flex items-center justify-between">
              {/* Profile Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onOpenSidebar}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
              </Button>
              
              {/* Lens Name */}
              {currentLens && (
                <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-white text-sm font-medium">{currentLens.name}</span>
                </div>
              )}
              
              {/* Info Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowLensInfo(!showLensInfo)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lens Info Panel */}
      <AnimatePresence>
        {showLensInfo && currentLens && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-4 z-20 bg-black/80 backdrop-blur-sm rounded-lg p-4 max-w-xs"
          >
            <h3 className="text-white font-semibold mb-2">{currentLens.name}</h3>
            <p className="text-gray-300 text-sm mb-2">{currentLens.description}</p>
            <p className="text-gray-400 text-xs">by {currentLens.creator}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Side Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-4"
          >
            {/* Camera Switch */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={switchCamera}
            >
              <Repeat className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom Controls - Lens Selector */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-4">
            {getVisibleLenses().map(({ lens, offset, index }) => (
              <motion.div
                key={lens?.id || index}
                className={`relative ${offset === 0 ? 'z-20' : 'z-10'}`}
                animate={{
                  scale: offset === 0 ? 1.2 : 0.8,
                  opacity: Math.abs(offset) <= 1 ? 1 : 0.5,
                  y: swipeDirection && Math.abs(offset) <= 1 ? swipeProgress * (swipeDirection === 'up' ? -20 : 20) : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Button
                  variant={offset === 0 ? "default" : "secondary"}
                  size="lg"
                  className={`w-16 h-16 rounded-full p-0 border-2 ${
                    offset === 0 
                      ? 'border-white bg-white text-black hover:bg-gray-100' 
                      : 'border-gray-400 bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                  onClick={offset === 0 ? handleCapture : () => setCurrentLensIndex(index)}
                >
                  {offset === 0 ? (
                    <Camera className="h-6 w-6" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {lens?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </Button>
                
                {/* Lens Name Label */}
                {Math.abs(offset) <= 1 && lens && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <span className="text-white text-xs text-center block whitespace-nowrap">
                      {lens.name}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Swipe Indicator */}
        {lenses.length > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2 text-white/60">
              <ChevronUp className="h-4 w-4" />
              <span className="text-xs">Swipe to change lens</span>
              <ChevronUp className="h-4 w-4 rotate-180" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}