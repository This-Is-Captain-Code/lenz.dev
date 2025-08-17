import { useState, useEffect, useRef, RefObject } from 'react';
import { initializeCamera, applyLensToCanvas, captureCanvas, cleanupCamera } from '../lib/cameraKitService';

type CameraStatus = 'loading' | 'permission_needed' | 'ready' | 'error';

export const useCameraKit = (
  containerRef: RefObject<HTMLDivElement>,
  canvasRef: RefObject<HTMLCanvasElement>
) => {
  const [status, setStatus] = useState<CameraStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isFlashEnabled, setIsFlashEnabled] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera on mount using simplified approach
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        if (!containerRef.current || !canvasRef.current) {
          throw new Error('Container or canvas reference not available');
        }

        // Check if we have camera permission first
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        if (permission.state === 'denied') {
          setStatus('permission_needed');
          return;
        }

        setStatus('loading');
        
        // Initialize camera with simplified implementation
        const stream = await initializeCamera({
          canvas: canvasRef.current,
          facingMode: isFrontCamera ? 'user' : 'environment'
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          await cleanupCamera();
          return;
        }
        
        streamRef.current = stream;
        setStatus('ready');
      } catch (err) {
        console.error('Camera initialization failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize camera');
          setStatus('error');
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      cleanupCamera().catch(err => {
        console.warn('Error during Camera Kit cleanup:', err);
      });
    };
  }, [containerRef, canvasRef, isFrontCamera]);

  // Request camera permission
  const requestPermission = async () => {
    try {
      setStatus('loading');
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Re-initialize camera after permission granted
      const stream = await initializeCamera({
        canvas: canvasRef.current!,
        facingMode: isFrontCamera ? 'user' : 'environment'
      });
      
      streamRef.current = stream;
      setStatus('ready');
    } catch (err) {
      console.error('Permission request failed:', err);
      setError(err instanceof Error ? err.message : 'Permission denied');
      setStatus('permission_needed');
    }
  };

  // Toggle between front and back camera
  const toggleCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    await cleanupCamera();
    setIsFrontCamera(prev => !prev);
  };

  // Toggle flash
  const toggleFlash = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        // Using any type for capabilities because torch is not defined in the standard MediaTrackCapabilities type
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities?.torch) {
          const newFlashState = !isFlashEnabled;
          // Using any type for constraints because torch is not in the standard MediaTrackConstraints
          videoTrack.applyConstraints({
            advanced: [{ torch: newFlashState } as any]
          }).then(() => {
            setIsFlashEnabled(newFlashState);
          }).catch(err => {
            console.error('Failed to toggle flash:', err);
          });
        } else {
          console.warn('Flash not supported on this device');
        }
      }
    }
  };
  
  // Apply lens to the canvas (simplified for debugging)
  const applyLens = (lensId: string) => {
    if (status !== 'ready' || !canvasRef.current) {
      return;
    }
    
    try {
      // Just log the ID for now but don't actually try to apply the lens
      console.log(`Would apply lens ID: ${lensId} (disabled for debugging)`);
      applyLensToCanvas(canvasRef.current, lensId, null);
    } catch (err) {
      console.error('Failed to apply lens:', err);
    }
  };

  // Capture photo from canvas
  const capturePhoto = async (): Promise<string | null> => {
    if (status !== 'ready' || !canvasRef.current) {
      return null;
    }
    
    try {
      return await captureCanvas(canvasRef.current);
    } catch (err) {
      console.error('Failed to capture photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
      return null;
    }
  };

  return {
    status,
    error,
    isFrontCamera,
    isFlashEnabled,
    requestPermission,
    toggleCamera,
    toggleFlash,
    applyLens,
    capturePhoto
  };
};
