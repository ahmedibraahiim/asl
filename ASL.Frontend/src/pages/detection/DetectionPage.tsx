import { useRef, useState, useEffect } from 'react';
import { aslRecognitionApi } from '../../services/apiService';
import './detection.css';

interface Landmark {
  x: number;
  y: number;
  z: number;
  index: number;
}

interface PredictionResponse {
  sign: string;
  confidence: number;
  landmarks: Landmark[];
  has_hand: boolean;
}

// Finger connections for drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],  // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],  // index finger
  [0, 9], [9, 10], [10, 11], [11, 12],  // middle finger
  [0, 13], [13, 14], [14, 15], [15, 16],  // ring finger
  [0, 17], [17, 18], [18, 19], [19, 20],  // pinky
  [5, 9], [9, 13], [13, 17],  // palm connections
];

const DetectionPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const requestRef = useRef<number | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  
  // For throttling API calls
  const lastCaptureTime = useRef<number>(0);
  const CAPTURE_INTERVAL = 500; // ms between captures

  // Check API health when component mounts
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const healthStatus = await aslRecognitionApi.checkHealth();
        setApiStatus(healthStatus.status === 'healthy' ? 'online' : 'offline');
        console.log("API status:", healthStatus);
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus('offline');
      }
    };

    checkApiHealth();
  }, []);

  // Setup webcam when component mounts
  useEffect(() => {
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Auto-start detection once video is loaded
          videoRef.current.onloadedmetadata = () => {
            setIsStarted(true);
            // Setup canvas size once video dimensions are known
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              
              // Start rendering frames immediately
              startRenderingFrames();
            }
          };
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setError('Could not access webcam. Please make sure your camera is connected and permissions are granted.');
      }
    };

    setupWebcam();

    // Cleanup function to stop webcam when unmounting
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Function to continuously render video frames to canvas
  const renderVideoFrame = () => {
    const drawFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Ensure canvas is the right size
      if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }
      
      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Draw landmarks if available
      if (landmarks && landmarks.length > 0) {
        drawLandmarksOnCanvas(ctx, canvas.width, canvas.height);
      }
      
      // Schedule next frame
      renderFrameRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start the rendering loop
    renderFrameRef.current = requestAnimationFrame(drawFrame);
  };
  
  const startRenderingFrames = () => {
    // Cancel any existing render loop
    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
    }
    
    // Start new render loop
    renderVideoFrame();
  };

  // Draw landmarks on provided canvas context
  const drawLandmarksOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!landmarks || landmarks.length === 0) return;
    
    // Scaling the landmarks to canvas size
    const scaleX = width;
    const scaleY = height;
    
    // Draw landmarks
    for (const landmark of landmarks) {
      ctx.beginPath();
      ctx.arc(
        landmark.x * scaleX,
        landmark.y * scaleY,
        6, // radius
        0,
        2 * Math.PI
      );
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fill();
    }
    
    // Draw connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (const [start, end] of HAND_CONNECTIONS) {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(
          landmarks[start].x * scaleX, 
          landmarks[start].y * scaleY
        );
        ctx.lineTo(
          landmarks[end].x * scaleX, 
          landmarks[end].y * scaleY
        );
        ctx.stroke();
      }
    }
  };

  // Process frame and update ui continuously
  const processFrame = async () => {
    if (
      !videoRef.current ||
      !processingCanvasRef.current ||
      !processingCanvasRef.current.getContext('2d') ||
      apiStatus !== 'online' ||
      processing
    ) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = Date.now();
    // Throttle API calls to prevent overwhelming the server
    if (now - lastCaptureTime.current < CAPTURE_INTERVAL) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    lastCaptureTime.current = now;
    setProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = processingCanvasRef.current;
      const context = canvas.getContext('2d')!;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas image to base64 (removing the data:image/png;base64, prefix)
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      // Send to ASL Recognition API
      const result = await aslRecognitionApi.detectSign(imageBase64);
      
      console.log("API response:", result);
      
      if (result.has_hand) {
        setDetectedSign(result.sign);
        setConfidence(result.confidence);
        setLandmarks(result.landmarks);
        setError(null);
      } else {
        // Only clear sign if no hand is detected
        setDetectedSign(null);
        setConfidence(null);
        setLandmarks([]);
        // Don't show error for no hand - that's normal during usage
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      setError('Error processing image. The API may be unavailable.');
    } finally {
      setProcessing(false);
      requestRef.current = requestAnimationFrame(processFrame);
    }
  };

  // Start or stop the continuous processing
  useEffect(() => {
    if (isStarted && apiStatus === 'online') {
      requestRef.current = requestAnimationFrame(processFrame);
      console.log("Started continuous processing");
    } else if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isStarted, apiStatus]);

  return (
    <div className="detection-page">
      <h1>Real-time ASL Detection</h1>
      
      {apiStatus === 'checking' && <p>Checking API status...</p>}
      {apiStatus === 'offline' && (
        <div className="alert alert-danger">
          ASL Recognition API is offline. Detection will not work.
        </div>
      )}
      
      <div className="detection-container">
        <div className="video-container">
          {/* Visible video element */}
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-video"
          />
          
          {/* Canvas overlay for landmarks */}
          <canvas 
            ref={canvasRef}
            className="landmark-canvas"
          />
          
          {/* Hidden canvas used for processing frames */}
          <canvas 
            ref={processingCanvasRef}
            style={{ display: 'none' }}
          />
        </div>
        
        {error && (
          <div className="alert alert-warning mt-3">
            {error}
          </div>
        )}
        
        {detectedSign && (
          <div className="result">
            <h2>Detected Sign:</h2>
            <div className="detected-sign">{detectedSign}</div>
            {confidence !== null && (
              <div className="confidence">
                Confidence: {(confidence * 100).toFixed(2)}%
              </div>
            )}
          </div>
        )}
        
        <div className="instructions">
          <h3>How to use:</h3>
          <ol>
            <li>Position your hand in front of the camera</li>
            <li>Make an ASL hand sign</li>
            <li>Hold the sign steadily for better recognition</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DetectionPage; 