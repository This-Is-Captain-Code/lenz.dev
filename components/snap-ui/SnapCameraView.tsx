'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lens, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { applyLensToCanvas, captureCanvas, initializeCamera } from '@/lib/cameraKitService';
import { useToast } from '@/hooks/use-toast';
import { Camera, Repeat, Sparkles, Download, Info, X, ChevronUp } from 'lucide-react';
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
        // Extract lenses from user lenses response
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
      applyLensToCanvas(canvasRef.current, currentLens.snapLensId, currentLens.snapGroupId)
        .catch((error) => {
          console.error('Failed to apply lens:', error);
        });
    }
  }, [currentLens, isCameraReady]);
  
  // Switch between front and back camera
  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setIsCameraReady(false); // Reset camera state to reinitialize
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
      const progress = Math.abs(deltaY) / 100; // Normalize to 0-1
      
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
      
      // Reset swipe state
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
      a.download = `lenz-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Function to copy image to clipboard
  const copyImageToClipboard = async (dataUrl: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      return true;
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      return false;
    }
  };

  // Function to share to Twitter/X
  const shareToTwitter = async () => {
    if (capturedPhoto) {
      // Create a text for the tweet
      const tweetText = "Captured using lenzdotdev";
      
      // Try to copy image to clipboard first
      const copied = await copyImageToClipboard(capturedPhoto);
      
      // Open Twitter with the text
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, '_blank');
      
      if (copied) {
        toast({
          title: "Image Copied!",
          description: "Photo copied to clipboard. Paste it into your tweet with Ctrl+V (Cmd+V on Mac).",
        });
      } else {
        // Fallback to download
        downloadPhoto();
        toast({
          title: "Ready to Tweet!",
          description: "Photo downloaded. Please attach it to your tweet.",
        });
      }
    }
  };
  
  // Handle back to camera view
  const backToCamera = () => {
    setCapturedPhoto(null);
  };
  
  // Get visible lenses for the selector (4 at a time)
  const getVisibleLenses = () => {
    if (lenses.length === 0) return [];
    
    const visible = [];
    for (let i = -2; i <= 2; i++) {
      const index = (currentLensIndex + i + lenses.length) % lenses.length;
      visible.push({
        lens: lenses[index],
        offset: i,
        index
      });
    }
    return visible;
  };

  if (capturedPhoto) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden">
        {/* Captured Photo Display */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={capturedPhoto} 
            alt="Captured photo" 
            className="max-w-full max-h-full object-contain"
          />
          
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-white hover:bg-white/20"
            onClick={backToCamera}
          >
            <X className="h-6 w-6" />
          </Button>
          
          {/* Share Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
            <Button
              variant="secondary"
              onClick={downloadPhoto}
              className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button
              onClick={shareToTwitter}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </Button>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
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
            
            {/* Lens Effects */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Sparkles className="h-5 w-5" />
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
                key={lens.id}
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
                        {lens.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </Button>
                
                {/* Lens Name Label */}
                {Math.abs(offset) <= 1 && (
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