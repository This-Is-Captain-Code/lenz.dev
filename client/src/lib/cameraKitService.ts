/**
 * Direct implementation from Snap Camera Kit tutorial
 * https://docs.snap.com/camera-kit/guides/tutorials/web/create-a-web-project
 */
import { SNAP_API_TOKEN } from './config';

// Simple implementation directly from the Snap Camera Kit tutorial
let cameraKit: any = null;
let session: any = null;
let currentLensId: string | null = null;

interface InitOptions {
  canvas: HTMLCanvasElement;
  facingMode: 'user' | 'environment';
}

/**
 * Initialize Camera Kit with the canvas and API token
 */
export const initializeCamera = async ({ canvas, facingMode }: InitOptions): Promise<MediaStream> => {
  try {
    console.log('Initializing basic Camera Kit setup...');
    
    // Check for custom API key first
    const apiToken = (window as any).SNAP_CUSTOM_API_KEY || SNAP_API_TOKEN;
    
    // Import Camera Kit dynamically
    const { bootstrapCameraKit } = await import('@snap/camera-kit');
    
    // Bootstrap Camera Kit with appropriate API token
    cameraKit = await bootstrapCameraKit({
      apiToken
    });
    console.log('CameraKit initialized successfully');
    
    // Create a session
    session = await cameraKit.createSession({ liveRenderTarget: canvas });
    console.log('Session created successfully');
    
    // Get user media 
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    console.log('Got media stream successfully');
    
    // Set the media stream as source
    await session.setSource(mediaStream);
    console.log('Set source successfully');
    
    // Start playing
    await session.play();
    console.log('Session playing successfully');
    
    return mediaStream;
  } catch (error) {
    console.error('Snap Camera Kit initialization failed:', error);
    throw error;
  }
};

/**
 * Apply a lens to the canvas
 */
export const applyLensToCanvas = async (
  canvas: HTMLCanvasElement,
  lensId: string,
  groupId: string | null
): Promise<void> => {
  if (!cameraKit || !session) {
    console.error('Camera Kit not initialized');
    throw new Error('Camera Kit not initialized');
  }
  
  try {
    console.log(`Attempting to apply lens: ${lensId} from group: ${groupId || 'default'}`);
    
    // Check for custom group ID first, then fall back to config or provided groupId
    let lensGroupId = (window as any).SNAP_CUSTOM_GROUP_ID;
    
    // If no custom group ID in window, import from config
    if (!lensGroupId) {
      const { SNAP_GROUP_ID } = await import('./config');
      lensGroupId = SNAP_GROUP_ID;
    }
    
    // Final fallback to the groupId parameter
    if (!lensGroupId && groupId) {
      lensGroupId = groupId;
    }
    
    console.log(`Creating lens with specific ID and group:`, { lensId, groupId: lensGroupId });
    
    // Load the lens with appropriate group ID
    const lens = await cameraKit.lensRepository.loadLens(lensId, lensGroupId as any);
    console.log(`Successfully created lens with specific ID:`, lensId);
    console.log('Lens loaded successfully');
    
    await session.applyLens(lens);
    console.log('Lens applied successfully');
    
    // Store the lens ID for later
    currentLensId = lensId;
  } catch (error) {
    console.error('Failed to apply lens:', error);
    throw error;
  }
};

/**
 * Capture current canvas state as an image
 */
export const captureCanvas = (canvas: HTMLCanvasElement): string => {
  try {
    console.log('Capturing canvas with dimensions:', canvas.width, 'x', canvas.height);
    
    // Create a temporary canvas to ensure we capture the full image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Draw the content of the original canvas to the temporary one
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error('Could not get canvas context');
    }
    
    // Flip the image horizontally to correct the mirror effect
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(canvas, -canvas.width, 0);
    
    // Get the data URL with higher quality
    const dataUrl = tempCanvas.toDataURL('image/png', 1.0);
    console.log('Canvas captured successfully, data URL length:', dataUrl.length);
    
    return dataUrl;
  } catch (error) {
    console.error('Failed to capture canvas:', error);
    throw new Error('Failed to capture photo');
  }
};

/**
 * Cleanup resources
 */
export const cleanupCameraKit = async (): Promise<void> => {
  try {
    if (session) {
      await session.pause();
      session = null;
    }
    
    cameraKit = null;
    currentLensId = null;
    
    console.log('Camera Kit resources cleaned up');
  } catch (error) {
    console.warn('Error during cleanup:', error);
  }
};
