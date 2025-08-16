import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lens, User } from '@shared/schema';
import { applyLensToCanvas, captureCanvas, initializeCamera } from '@/lib/cameraKitService';
import { useToast } from '@/hooks/use-toast';
import { Camera, Question, User as UserIcon, X, Download } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

interface SnapCameraViewProps {
  defaultLensId?: string;
  userLensesOnly?: boolean;
  onOpenSidebar?: () => void;
}

export function SnapCameraView({ 
  defaultLensId, 
  userLensesOnly = false,
  onOpenSidebar
}: SnapCameraViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSelectorRef = useRef<HTMLDivElement>(null);
  const rightSelectorRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [currentLensIndex, setCurrentLensIndex] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Lens selector state - showing 4 lenses at a time
  const [visibleLensStartIndex, setVisibleLensStartIndex] = useState(0);
  
  // Fetch lenses
  const { data: allLenses = [], isLoading: isLoadingLenses } = useQuery<Lens[]>({
    queryKey: ['/api/lenses'],
  });
  
  // Fetch user's purchased lenses if needed
  const { data: userLenses = [], isLoading: isLoadingUserLenses } = useQuery<Lens[]>({
    queryKey: ['/api/my-lenses'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/my-lenses', { credentials: 'include' });
        if (!response.ok) return [];
        const result = await response.json();
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
  const currentLens = lenses[currentLensIndex] || null;
  
  // Initialize camera
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const initCamera = async () => {
      try {
        const stream = await initializeCamera({
          canvas: canvasRef.current!,
          facingMode
        });
        
        setMediaStream(stream);
        setIsCameraReady(true);
        
        // Apply lens if available
        if (currentLens) {
          await applyLensToCanvas(canvasRef.current!, currentLens.snapLensId, currentLens.snapGroupId);
        }
      } catch (error) {
        console.error('Failed to initialize camera:', error);
        toast({
          title: "Camera Error",
          description: "Could not access the camera. Please check permissions.",
          variant: "destructive"
        });
      }
    };
    
    initCamera();
    
    // Cleanup function
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      setIsCameraReady(false);
    };
  }, [facingMode]);
  
  // Apply lens when it changes
  useEffect(() => {
    if (canvasRef.current && currentLens && isCameraReady) {
      applyLensToCanvas(canvasRef.current, currentLens.snapLensId, currentLens.snapGroupId)
        .catch(error => {
          console.error('Failed to apply lens:', error);
          toast({
            title: "Lens Error",
            description: "Failed to apply the selected lens.",
            variant: "destructive"
          });
        });
    }
  }, [currentLens, isCameraReady, toast]);
  
  // Setup gesture handling for lens selector areas
  useEffect(() => {
    const leftSelector = leftSelectorRef.current;
    const rightSelector = rightSelectorRef.current;
    
    if (!leftSelector || !rightSelector) return;
    
    const handleLeftSwipe = (e: TouchEvent) => {
      e.preventDefault();
      cycleToPreviousLens();
    };
    
    const handleRightSwipe = (e: TouchEvent) => {
      e.preventDefault();
      cycleToNextLens();
    };
    
    leftSelector.addEventListener('touchstart', handleLeftSwipe);
    rightSelector.addEventListener('touchstart', handleRightSwipe);
    
    return () => {
      leftSelector.removeEventListener('touchstart', handleLeftSwipe);
      rightSelector.removeEventListener('touchstart', handleRightSwipe);
    };
  }, [currentLensIndex, lenses.length]);
  
  // Cycle to next lens
  const cycleToNextLens = () => {
    if (lenses.length === 0) return;
    setCurrentLensIndex(current => (current + 1) % lenses.length);
    
    // Update visible lens window if needed
    const nextIndex = (currentLensIndex + 1) % lenses.length;
    if (nextIndex >= visibleLensStartIndex + 4) {
      setVisibleLensStartIndex(current => Math.min(current + 1, lenses.length - 4));
    } else if (nextIndex < visibleLensStartIndex) {
      setVisibleLensStartIndex(0);
    }
  };
  
  // Cycle to previous lens
  const cycleToPreviousLens = () => {
    if (lenses.length === 0) return;
    setCurrentLensIndex(current => (current - 1 + lenses.length) % lenses.length);
    
    // Update visible lens window if needed
    const prevIndex = (currentLensIndex - 1 + lenses.length) % lenses.length;
    if (prevIndex < visibleLensStartIndex) {
      setVisibleLensStartIndex(current => Math.max(current - 1, 0));
    } else if (prevIndex >= visibleLensStartIndex + 4) {
      setVisibleLensStartIndex(Math.max(0, lenses.length - 4));
    }
  };
  
  // Handle help toggle
  const toggleHelp = () => {
    setShowHelp(prev => !prev);
  };
  
  // Capture photo
  const capturePhoto = () => {
    if (canvasRef.current) {
      const dataUrl = captureCanvas(canvasRef.current);
      setCapturedPhoto(dataUrl);
      
      // For now, just show a toast
      toast({
        title: "Photo Captured",
        description: "Your photo has been captured with the lens applied.",
      });
    }
  };
  
  // Function to download the current photo
  const downloadPhoto = () => {
    if (capturedPhoto) {
      const a = document.createElement('a');
      a.href = capturedPhoto;
      a.download = `lens-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  // Handle back to camera view
  const backToCamera = () => {
    setCapturedPhoto(null);
  };
  
  // Get visible lenses for the selector (4 at a time)
  const getVisibleLenses = () => {
    if (lenses.length <= 4) return lenses;
    return lenses.slice(visibleLensStartIndex, visibleLensStartIndex + 4);
  };
  
  // Render top bar with profile, filter name, and help icon
  const renderTopBar = () => {
    return (
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4 pt-12 bg-gradient-to-b from-black/30 to-transparent">
        {/* Profile Icon - Top Left */}
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90"
          onClick={onOpenSidebar}
          data-testid="button-profile"
        >
          <UserIcon className="h-6 w-6" />
        </Button>
        
        {/* Filter Name - Top Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <span className="text-white font-medium text-sm" data-testid="text-current-filter">
              {currentLens?.name || 'No Filter'}
            </span>
          </div>
        </div>
        
        {/* Help Icon - Top Right */}
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90"
          onClick={toggleHelp}
          data-testid="button-help"
        >
          <Question className="h-6 w-6" />
        </Button>
      </div>
    );
  };
  
  // Render bottom section with lens selectors and capture button
  const renderBottomControls = () => {
    const visibleLenses = getVisibleLenses();
    
    return (
      <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-center pb-8 bg-gradient-to-t from-black/30 to-transparent">
        <div className="flex items-center justify-center w-full max-w-md">
          {/* Left lens selector area */}
          <div 
            ref={leftSelectorRef}
            className="flex-1 flex items-center justify-center py-4 touch-manipulation"
            data-testid="area-left-lens-selector"
          >
            <div className="flex space-x-2">
              {visibleLenses.slice(0, 2).map((lens, index) => {
                const actualIndex = visibleLensStartIndex + index;
                const isSelected = actualIndex === currentLensIndex;
                return (
                  <Button
                    key={lens.id}
                    size="icon"
                    className={`h-12 w-12 rounded-full text-sm font-bold transition-all ${
                      isSelected 
                        ? 'bg-white text-black scale-110' 
                        : 'bg-white/20 text-white border border-white/40'
                    }`}
                    onClick={() => setCurrentLensIndex(actualIndex)}
                    data-testid={`button-lens-${actualIndex + 1}`}
                  >
                    {actualIndex + 1}
                  </Button>
                );
              })}
            </div>
          </div>
          
          {/* Center capture button */}
          <div className="flex-none px-6">
            <Button 
              size="icon" 
              className="h-20 w-20 rounded-full bg-white text-black hover:bg-white/90 border-4 border-white/40 transition-transform active:scale-95"
              onClick={capturePhoto}
              data-testid="button-capture"
            >
              <Camera className="h-10 w-10" />
            </Button>
          </div>
          
          {/* Right lens selector area */}
          <div 
            ref={rightSelectorRef}
            className="flex-1 flex items-center justify-center py-4 touch-manipulation"
            data-testid="area-right-lens-selector"
          >
            <div className="flex space-x-2">
              {visibleLenses.slice(2, 4).map((lens, index) => {
                const actualIndex = visibleLensStartIndex + index + 2;
                const isSelected = actualIndex === currentLensIndex;
                return (
                  <Button
                    key={lens.id}
                    size="icon"
                    className={`h-12 w-12 rounded-full text-sm font-bold transition-all ${
                      isSelected 
                        ? 'bg-white text-black scale-110' 
                        : 'bg-white/20 text-white border border-white/40'
                    }`}
                    onClick={() => setCurrentLensIndex(actualIndex)}
                    data-testid={`button-lens-${actualIndex + 1}`}
                  >
                    {actualIndex + 1}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render help overlay
  const renderHelpOverlay = () => {
    if (!showHelp) return null;
    
    return (
      <motion.div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowHelp(false)}
      >
        <div className="bg-white rounded-2xl p-6 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-4">How to Use</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Tap lens numbers to switch between effects</p>
            <p>• Swipe left/right areas to cycle through all lenses</p>
            <p>• Tap the big white button to capture photos</p>
            <p>• Use the profile icon to access settings</p>
          </div>
          <Button 
            className="mt-6 w-full rounded-full"
            onClick={() => setShowHelp(false)}
            data-testid="button-close-help"
          >
            Got it!
          </Button>
        </div>
      </motion.div>
    );
  };
  
  // Render photo capture view
  const renderCapturedPhotoView = () => {
    if (!capturedPhoto) return null;
    
    return (
      <div className="absolute inset-0 bg-black flex flex-col">
        <div className="flex-1 relative">
          <img 
            src={capturedPhoto} 
            alt="Captured photo" 
            className="absolute inset-0 w-full h-full object-contain"
            data-testid="img-captured-photo"
          />
        </div>
        
        <div className="p-6 flex justify-between">
          <Button 
            variant="outline" 
            className="rounded-full px-4 bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white"
            onClick={backToCamera}
            data-testid="button-discard-photo"
          >
            <X className="mr-2 h-4 w-4" />
            Discard
          </Button>
          
          <Button 
            className="rounded-full px-4"
            onClick={downloadPhoto}
            data-testid="button-save-photo"
          >
            <Download className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black flex items-center justify-center font-['Inter_Display',_system-ui,_sans-serif]"
    >
      {/* Canvas for the camera view */}
      <canvas 
        ref={canvasRef} 
        width={720}
        height={1280}
        className="max-h-full max-w-full object-contain"
        data-testid="canvas-camera"
      />
      
      {/* Loading state */}
      {(!isCameraReady || isLoadingLenses) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-white animate-spin mb-4"></div>
            <p className="text-white font-medium" data-testid="text-loading">Loading camera...</p>
          </div>
        </div>
      )}
      
      {/* New Snapchat-like UI */}
      {isCameraReady && !capturedPhoto && (
        <>
          {/* Top bar with profile, filter name, and help */}
          {renderTopBar()}
          
          {/* Bottom controls with lens selectors and capture button */}
          {renderBottomControls()}
        </>
      )}
      
      {/* Help overlay */}
      <AnimatePresence>
        {renderHelpOverlay()}
      </AnimatePresence>
      
      {/* Captured photo view */}
      {capturedPhoto && renderCapturedPhotoView()}
    </div>
  );
}