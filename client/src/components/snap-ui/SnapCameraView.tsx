import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lens, User } from '@shared/schema';
import { applyLensToCanvas, captureCanvas, initializeCamera } from '@/lib/cameraKitService';
import { useToast } from '@/hooks/use-toast';
import { Camera, Repeat, Sparkles, Download, Info, X, ChevronUp } from 'lucide-react';
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
  
  // Setup gesture handling for swipe and touch interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let startY = 0;
    let isDragging = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      setSwipeProgress(0);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      const progress = Math.min(Math.abs(deltaY) / 200, 1);
      
      setSwipeProgress(progress);
      setSwipeDirection(deltaY > 0 ? 'down' : 'up');
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startY;
      
      if (Math.abs(deltaY) > 60) {
        if (deltaY < 0 && currentLensIndex < lenses.length - 1) {
          // Swipe up - next lens
          setCurrentLensIndex(current => (current + 1) % lenses.length);
        } else if (deltaY > 0 && currentLensIndex > 0) {
          // Swipe down - previous lens
          setCurrentLensIndex(current => (current - 1 + lenses.length) % lenses.length);
        }
      }
      
      isDragging = false;
      setSwipeProgress(0);
      setSwipeDirection(null);
    };
    
    const handleTap = (e: MouseEvent) => {
      // Toggle controls on tap, only if not clicking a button
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        setShowControls(prev => !prev);
        setShowLensInfo(false);
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('click', handleTap);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('click', handleTap);
    };
  }, [currentLensIndex, lenses.length]);
  
  // Handle camera flip
  const toggleCameraFacing = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setFacingMode(current => (current === 'user' ? 'environment' : 'user'));
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
  
  // Handle lens info toggle
  const toggleLensInfo = () => {
    setShowLensInfo(prev => !prev);
  };
  
  // Render lens indicator dots
  const renderLensIndicators = () => {
    return (
      <div className="absolute top-4 right-4 flex flex-col items-center space-y-1">
        {lenses.map((_, index) => (
          <div 
            key={index} 
            className={`w-2 h-2 rounded-full ${
              index === currentLensIndex 
                ? 'bg-primary' 
                : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    );
  };
  
  // Render bottom controls
  const renderBottomControls = () => {
    return (
      <div className="absolute bottom-8 inset-x-0 flex justify-center">
        <div className="flex items-center space-x-6">
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            onClick={toggleLensInfo}
            data-testid="button-lens-info"
          >
            <Info className="h-6 w-6" />
          </Button>
          
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-full bg-white text-primary"
            onClick={capturePhoto}
            data-testid="button-capture"
          >
            <Camera className="h-8 w-8" />
          </Button>
          
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            onClick={toggleCameraFacing}
            data-testid="button-camera-flip"
          >
            <Repeat className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  };
  
  // Swipe indicators
  const renderSwipeIndicators = () => {
    return (
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        <AnimatePresence>
          {swipeDirection === 'up' && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: swipeProgress, y: -20 * swipeProgress }}
              exit={{ opacity: 0 }}
              className="absolute text-white text-sm font-medium"
            >
              <ChevronUp className="h-8 w-8 mx-auto" />
              <div>Next lens</div>
            </motion.div>
          )}
          
          {swipeDirection === 'down' && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: swipeProgress, y: 20 * swipeProgress }}
              exit={{ opacity: 0 }}
              className="absolute text-white text-sm font-medium rotate-180"
            >
              <ChevronUp className="h-8 w-8 mx-auto" />
              <div className="rotate-180">Previous lens</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  // Render the lens info overlay
  const renderLensInfo = () => {
    if (!currentLens || !showLensInfo) return null;
    
    return (
      <motion.div 
        className="absolute inset-0 bg-black/60 flex flex-col justify-end p-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="bg-background/90 rounded-xl p-4 max-w-full">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-bold" data-testid="text-lens-name">{currentLens.name}</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setShowLensInfo(false)}
              data-testid="button-close-lens-info"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3" data-testid="text-lens-description">
            {currentLens.description || 'No description available.'}
          </p>
          
          <div className="flex justify-between text-sm">
            <div>
              <span className="font-medium">Creator:</span> <span data-testid="text-lens-creator">{currentLens.creator}</span>
            </div>
            <div>
              <Download className="inline-block h-4 w-4 mr-1" />
              <span data-testid="text-lens-downloads">{currentLens.downloads || 0}</span>
            </div>
          </div>
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
      className="relative h-full w-full overflow-hidden bg-black flex items-center justify-center"
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
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-primary animate-spin mb-4"></div>
            <p className="text-white" data-testid="text-loading">Loading camera...</p>
          </div>
        </div>
      )}
      
      {/* UI Controls */}
      <AnimatePresence>
        {showControls && isCameraReady && !capturedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Top bar - Lens info */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start pointer-events-auto">
              <Button 
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40"
                onClick={onOpenSidebar}
                data-testid="button-open-sidebar"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
              
              {currentLens && (
                <div className="rounded-full bg-black/20 text-white px-3 py-1 text-sm backdrop-blur-sm" data-testid="text-current-lens">
                  {currentLens.name}
                </div>
              )}
            </div>
            
            {/* Lens indicators */}
            {renderLensIndicators()}
            
            {/* Bottom controls */}
            <div className="pointer-events-auto">
              {renderBottomControls()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Swipe indicators */}
      {renderSwipeIndicators()}
      
      {/* Lens info overlay */}
      <AnimatePresence>
        {showLensInfo && renderLensInfo()}
      </AnimatePresence>
      
      {/* Captured photo view */}
      {capturedPhoto && renderCapturedPhotoView()}
    </div>
  );
}