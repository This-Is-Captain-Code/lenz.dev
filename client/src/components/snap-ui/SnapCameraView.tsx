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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [currentLensIndex, setCurrentLensIndex] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  

  
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
  
  // Setup gesture handling for carousel swipe
  useEffect(() => {
    const carousel = containerRef.current;
    if (!carousel) return;
    
    let startX = 0;
    let isDragging = false;
    let startTime = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only handle touches in the bottom area (carousel area)
      const touch = e.touches[0];
      const rect = carousel.getBoundingClientRect();
      const relativeY = touch.clientY - rect.top;
      const carouselAreaStart = rect.height * 0.75; // Bottom 25% of screen
      
      if (relativeY < carouselAreaStart) return;
      
      startX = touch.clientX;
      startTime = Date.now();
      isDragging = true;
      e.preventDefault();
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaTime = Date.now() - startTime;
      const velocity = Math.abs(deltaX) / deltaTime;
      
      // Minimum swipe distance and velocity for lens change
      if (Math.abs(deltaX) > 50 || velocity > 0.5) {
        if (deltaX > 0) {
          // Swipe right - previous lens
          cycleToPreviousLens();
        } else {
          // Swipe left - next lens
          cycleToNextLens();
        }
      }
      
      isDragging = false;
    };
    
    carousel.addEventListener('touchstart', handleTouchStart, { passive: false });
    carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
    carousel.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      carousel.removeEventListener('touchstart', handleTouchStart);
      carousel.removeEventListener('touchmove', handleTouchMove);
      carousel.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentLensIndex, lenses.length]);
  
  // Cycle to next lens
  const cycleToNextLens = () => {
    if (lenses.length === 0) return;
    setCurrentLensIndex(current => (current + 1) % lenses.length);
  };
  
  // Cycle to previous lens
  const cycleToPreviousLens = () => {
    if (lenses.length === 0) return;
    setCurrentLensIndex(current => (current - 1 + lenses.length) % lenses.length);
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
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4 pt-4 bg-gradient-to-b from-black/30 to-transparent">
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
  
  // Render bottom section with centered carousel (selected lens always in center)
  const renderBottomControls = () => {
    // Calculate which lenses to show around the selected one
    const getCarouselLenses = () => {
      if (lenses.length === 0) return [];
      
      const result = [];
      const totalVisible = 5; // Show 5 lenses total (2 left + center + 2 right)
      const centerOffset = Math.floor(totalVisible / 2);
      
      for (let i = -centerOffset; i <= centerOffset; i++) {
        const index = (currentLensIndex + i + lenses.length) % lenses.length;
        result.push({
          lens: lenses[index],
          actualIndex: index,
          position: i, // -2, -1, 0, 1, 2 where 0 is center
        });
      }
      
      return result;
    };
    
    const carouselLenses = getCarouselLenses();
    
    return (
      <div className="absolute bottom-0 inset-x-0 z-10 pb-12 bg-gradient-to-t from-black/50 via-black/20 to-transparent">
        {/* Centered lens carousel */}
        <div className="flex justify-center items-center px-4">
          <div className="flex items-center justify-center space-x-4">
            {carouselLenses.map(({ lens, actualIndex, position }) => {
              const isSelected = position === 0; // Center position is selected
              const isCapture = isSelected; // Selected lens acts as capture button
              
              // Size and styling based on position
              let sizeClass = 'w-12 h-12'; // Outermost lenses
              let iconSizeClass = 'w-6 h-6';
              if (Math.abs(position) === 1) {
                sizeClass = 'w-16 h-16'; // Adjacent to center
                iconSizeClass = 'w-8 h-8';
              }
              if (isSelected) {
                sizeClass = 'w-20 h-20'; // Center (selected)
                iconSizeClass = 'w-10 h-10';
              }
              
              // Opacity based on distance from center
              let opacityClass = 'opacity-50';
              if (Math.abs(position) === 1) opacityClass = 'opacity-75';
              if (isSelected) opacityClass = 'opacity-100';
              
              // Generate a placeholder image based on lens type
              const getPlaceholderIcon = () => {
                if (isCapture) return <Camera className={iconSizeClass} />;
                
                // Simple placeholder icons based on lens name/category
                const lensName = lens.name.toLowerCase();
                if (lensName.includes('golden') || lensName.includes('vintage')) {
                  return <div className={`${iconSizeClass} rounded-full bg-gradient-to-br from-yellow-400 to-orange-500`} />;
                } else if (lensName.includes('cyber') || lensName.includes('tech')) {
                  return <div className={`${iconSizeClass} rounded-full bg-gradient-to-br from-blue-400 to-purple-500`} />;
                } else if (lensName.includes('pastel') || lensName.includes('dreamy')) {
                  return <div className={`${iconSizeClass} rounded-full bg-gradient-to-br from-pink-300 to-purple-300`} />;
                } else if (lensName.includes('mono') || lensName.includes('black')) {
                  return <div className={`${iconSizeClass} rounded-full bg-gradient-to-br from-gray-300 to-gray-600`} />;
                } else if (lensName.includes('aurora') || lensName.includes('glow')) {
                  return <div className={`${iconSizeClass} rounded-full bg-gradient-to-br from-green-400 to-teal-500`} />;
                } else {
                  return <div className={`${iconSizeClass} rounded-full bg-gradient-to-br from-indigo-400 to-pink-400`} />;
                }
              };
              
              return (
                <div key={`${lens.id}-${position}`} className="flex flex-col items-center">
                  <Button
                    size="icon"
                    className={`${sizeClass} rounded-full p-0 transition-all duration-300 touch-manipulation overflow-hidden ${opacityClass} ${
                      isSelected
                        ? 'bg-white text-black border-4 border-white shadow-2xl scale-110'
                        : 'bg-white/90 text-black border-2 border-white/80 hover:bg-white hover:scale-105'
                    }`}
                    onClick={() => {
                      if (isCapture) {
                        capturePhoto();
                      } else {
                        setCurrentLensIndex(actualIndex);
                      }
                    }}
                    data-testid={isCapture ? 'button-capture' : `button-lens-${actualIndex + 1}`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {getPlaceholderIcon()}
                    </div>
                  </Button>
                  
                </div>
              );
            })}
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
      className="relative h-screen w-full overflow-hidden bg-black font-['Inter_Display',_system-ui,_sans-serif]"
    >
      {/* Canvas for the camera view */}
      <canvas 
        ref={canvasRef} 
        width={720}
        height={1280}
        className="absolute inset-0 w-full h-full object-cover"
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