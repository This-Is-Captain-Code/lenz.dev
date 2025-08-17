/**
 * Direct implementation from Snap Camera Kit tutorial
 * https://docs.snap.com/camera-kit/guides/tutorials/web/create-a-web-project
 */
import { SNAP_API_TOKEN } from './config';

// Dynamic imports for client-side only
let bootstrapCameraKit: any;
let CameraKit: any;
let CameraKitSession: any;

// Load Camera Kit only on client side
const loadCameraKit = async () => {
  if (typeof window !== 'undefined' && !bootstrapCameraKit) {
    const cameraKitModule = await import('@snap/camera-kit');
    bootstrapCameraKit = cameraKitModule.bootstrapCameraKit;
    CameraKit = cameraKitModule.CameraKit;
    CameraKitSession = cameraKitModule.CameraKitSession;
  }
};

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
    
    // Load Camera Kit module
    await loadCameraKit();
    
    // Check for custom API key first
    const apiToken = (window as any).SNAP_CUSTOM_API_KEY || SNAP_API_TOKEN;
    
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
    console.log(`Applying lens ${lensId} from group ${groupId}`);
    
    // Skip if same lens is already applied
    if (currentLensId === lensId) {
      console.log('Lens already applied, skipping');
      return;
    }
    
    let lens;
    
    if (groupId) {
      // Fetch the lens from the specified group
      const lensRepository = cameraKit.lensRepository;
      const group = await lensRepository.getGroup(groupId);
      lens = await group.getLens(lensId);
    } else {
      // Fallback to direct lens fetch if no group
      const lensRepository = cameraKit.lensRepository;
      lens = await lensRepository.getLens(lensId);
    }
    
    if (!lens) {
      throw new Error(`Lens ${lensId} not found`);
    }
    
    // Apply the lens
    await session.applyLens(lens);
    currentLensId = lensId;
    console.log(`Successfully applied lens: ${lensId}`);
    
  } catch (error) {
    console.error('Failed to apply lens:', error);
    throw error;
  }
};

/**
 * Capture a photo from the canvas
 */
export const captureCanvas = async (canvas: HTMLCanvasElement): Promise<string> => {
  try {
    console.log('Capturing photo from canvas...');
    
    // Create a new canvas for the final image with 9:16 aspect ratio
    const captureCanvas = document.createElement('canvas');
    const ctx = captureCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Set the capture dimensions to 9:16 aspect ratio
    const targetWidth = 1080;
    const targetHeight = 1920;
    captureCanvas.width = targetWidth;
    captureCanvas.height = targetHeight;
    
    // Calculate source dimensions to maintain aspect ratio
    const sourceWidth = canvas.width;
    const sourceHeight = canvas.height;
    
    // Calculate scaling to fit the target dimensions
    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;
    const scale = Math.max(scaleX, scaleY); // Use max to ensure full coverage
    
    // Calculate source rect to center the crop
    const scaledSourceWidth = targetWidth / scale;
    const scaledSourceHeight = targetHeight / scale;
    const sourceX = (sourceWidth - scaledSourceWidth) / 2;
    const sourceY = (sourceHeight - scaledSourceHeight) / 2;
    
    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Draw the canvas content, cropped and scaled to 9:16
    ctx.drawImage(
      canvas,
      sourceX, sourceY, scaledSourceWidth, scaledSourceHeight,
      0, 0, targetWidth, targetHeight
    );
    
    // Convert to data URL
    const dataUrl = captureCanvas.toDataURL('image/png', 1.0);
    console.log('Photo captured successfully');
    
    return dataUrl;
  } catch (error) {
    console.error('Failed to capture photo:', error);
    throw error;
  }
};

/**
 * Clean up Camera Kit resources
 */
export const cleanupCamera = async (): Promise<void> => {
  try {
    if (session) {
      await session.destroy();
      session = null;
    }
    
    cameraKit = null;
    currentLensId = null;
    console.log('Camera Kit cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup Camera Kit:', error);
  }
};