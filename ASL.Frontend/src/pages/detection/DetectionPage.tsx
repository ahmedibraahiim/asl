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
  
  // For sentence building feature
  const [buildingSentence, setBuildingSentence] = useState(false);
  const [currentSentence, setCurrentSentence] = useState('');
  const [lastDetectedSign, setLastDetectedSign] = useState<string | null>(null);
  const lastDetectedTime = useRef<number>(0);
  const LETTER_HOLD_TIME = 1000; // 1 second in milliseconds
  
  // For throttling API calls
  const lastCaptureTime = useRef<number>(0);
  const CAPTURE_INTERVAL = 150; // ms between captures

  // State to track how long the current sign has been held
  const [signHoldProgress, setSignHoldProgress] = useState(0);
  
  // Track detected sign and add to sentence if held for enough time
  useEffect(() => {
    if (!buildingSentence || !detectedSign) {
      // Reset progress when not building sentence or no sign detected
      setSignHoldProgress(0);
      return;
    }
    
    // If the sign changed, reset the timer
    if (detectedSign !== lastDetectedSign) {
      setLastDetectedSign(detectedSign);
      lastDetectedTime.current = Date.now();
      setSignHoldProgress(0);
      console.log(`New sign detected: ${detectedSign}, timer started`);
      return;
    }
    
    // Start a simple interval to update the progress bar
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const elapsedTime = now - lastDetectedTime.current;
      
      if (elapsedTime >= LETTER_HOLD_TIME) {
        // If we've reached the hold time, add the letter
        
        // Check if the sign is "del" to handle backspace functionality
        if (detectedSign.toLowerCase() === "del") {
          // Remove the last character from the sentence
          setCurrentSentence(prev => prev.slice(0, -1));
          console.log("Deleted last character from sentence");
        } else {
          // Determine what to add
          const isSpace = detectedSign.toLowerCase() === "space";
          const textToAdd = isSpace ? " " : detectedSign;
          
          // Add to sentence
          setCurrentSentence(prev => prev + textToAdd);
          console.log(`Added "${textToAdd}" to sentence`);
        }
        
        // Flash background for visual feedback
        const sentenceElement = document.querySelector('.current-sentence');
        if (sentenceElement) {
          sentenceElement.classList.add('letter-added');
          setTimeout(() => {
            sentenceElement.classList.remove('letter-added');
          }, 300);
        }
        
        // CRITICAL PART: Reset for next detection but keep the same sign
        clearInterval(progressInterval);
        setSignHoldProgress(0);
        lastDetectedTime.current = Date.now();
        
        // Force a sign change detection cycle by briefly clearing lastDetectedSign
        const currentSign = detectedSign;
        setLastDetectedSign(null);
        setTimeout(() => {
          setLastDetectedSign(currentSign);
        }, 100);
      } else {
        // Update progress bar normally
        const progress = (elapsedTime / LETTER_HOLD_TIME) * 100;
        setSignHoldProgress(progress);
      }
    }, 33); // Update more frequently (30 fps) for smoother animation
    
    // Clean up interval when component unmounts or dependencies change
    return () => clearInterval(progressInterval);
  }, [detectedSign, lastDetectedSign, buildingSentence]);
  
  // Remove any other useEffects that might be handling the progress bar
  // to avoid conflicts

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
    console.log("Webcam setup initialized");

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
  
  // Restart rendering when landmarks change
  useEffect(() => {
    if (landmarks.length > 0) {
      console.log("Landmarks updated, restarting rendering");
      startRenderingFrames();
    }
  }, [landmarks]);
  
  // Handle keyboard events for sentence building
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sentence building with 's' key
      if (event.key.toLowerCase() === 's') {
        setBuildingSentence(prev => {
          const newState = !prev;
          console.log(`Sentence building ${newState ? 'started' : 'stopped'}`);
          
          // Reset tracking when stopping
          if (!newState) {
            setLastDetectedSign(null);
            lastDetectedTime.current = 0;
          }
          
          return newState;
        });
      }
      
      // Clear sentence with 'c' key
      if (event.key.toLowerCase() === 'c' && buildingSentence) {
        clearSentence();
        console.log('Sentence cleared with keyboard shortcut');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [buildingSentence]); // Add buildingSentence to dependencies

  // Custom display for signs
  const getDisplayText = (sign: string | null): string => {
    if (!sign) return '';
    // Special display rules for signs - case insensitive check
    if (sign.toLowerCase() === 'space') return '␣'; // Special space symbol that's visible
    return sign;
  };

  // Function to clear the current sentence
  const clearSentence = () => {
    setCurrentSentence('');
  };

  // Function to continuously render video frames to canvas
  const renderVideoFrame = () => {
    const drawFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        console.log("Missing video or canvas reference");
        renderFrameRef.current = requestAnimationFrame(drawFrame);
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        console.error("Failed to get 2D context");
        return;
      }
      
      // Ensure canvas is the right size
      if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
        console.log(`Resizing canvas to ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }
      
      // Clear the canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Flip horizontally to fix mirror effect
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
      
      // Draw landmarks if available
      if (landmarks && landmarks.length > 0) {
        console.log(`Rendering ${landmarks.length} landmarks on canvas`);
        drawLandmarksOnCanvas(ctx, canvas.width, canvas.height);
      } else {
        console.log("No landmarks to draw");
      }
      
      // Schedule next frame
      renderFrameRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start the rendering loop
    console.log("Starting render frame loop");
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
    
    // Scaling the landmarks to canvas size and applying horizontal flip
    const scaleX = width;
    const scaleY = height;
    
    // Optional: Add shadow for a glow effect (use smaller blur for thinner lines)
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 2;
    
    // Color mapping for different landmark groups
    const colors = {
      thumb: 'rgba(255, 0, 0, 0.9)',        // Red for thumb
      indexFinger: 'rgba(0, 255, 0, 0.9)',  // Green for index finger
      middleFinger: 'rgba(0, 0, 255, 0.9)', // Blue for middle finger
      ringFinger: 'rgba(255, 255, 0, 0.9)', // Yellow for ring finger
      pinky: 'rgba(255, 0, 255, 0.9)',      // Purple for pinky
      wrist: 'rgba(255, 255, 255, 0.9)'     // White for wrist/palm
    };
    
    // Get color for a landmark based on its index
    const getLandmarkColor = (index: number): string => {
      if (index === 0) return colors.wrist;
      if (index >= 1 && index <= 4) return colors.thumb;
      if (index >= 5 && index <= 8) return colors.indexFinger;
      if (index >= 9 && index <= 12) return colors.middleFinger;
      if (index >= 13 && index <= 16) return colors.ringFinger;
      if (index >= 17 && index <= 20) return colors.pinky;
      return 'rgba(0, 255, 0, 0.9)'; // Default color
    };
    
    // Helper function to draw a small circle at a point
    const drawCircle = (x: number, y: number, radius: number, color: string) => {
      ctx.beginPath();
      // Flip x-coordinate to match the flipped video
      ctx.arc(width - x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Add a thin white border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    
    // Draw connections first so they appear behind landmarks
    ctx.lineWidth = 2; // Thinner lines
    
    // Store intermediate points for later drawing
    const intermediatePoints: Array<{x: number, y: number, color: string}> = [];
    
    // Draw connections with gradient colors between connected landmarks
    for (const [start, end] of HAND_CONNECTIONS) {
      if (landmarks[start] && landmarks[end]) {
        // Calculate flipped coordinates
        const startX = width - (landmarks[start].x * scaleX);
        const startY = landmarks[start].y * scaleY;
        const endX = width - (landmarks[end].x * scaleX);
        const endY = landmarks[end].y * scaleY;
        
        // Create gradient for connections
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, getLandmarkColor(landmarks[start].index));
        gradient.addColorStop(1, getLandmarkColor(landmarks[end].index));
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.stroke();
        
        // Calculate points at 30% and 70% along the line
        const point30X = startX + (endX - startX) * 0.3;
        const point30Y = startY + (endY - startY) * 0.3;
        const point70X = startX + (endX - startX) * 0.7;
        const point70Y = startY + (endY - startY) * 0.7;
        
        // Store intermediate points for drawing later
        intermediatePoints.push({
          x: point30X, 
          y: point30Y, 
          color: getLandmarkColor(landmarks[start].index)
        });
        
        intermediatePoints.push({
          x: point70X, 
          y: point70Y, 
          color: getLandmarkColor(landmarks[end].index)
        });
      }
    }
    
    // Remove shadow for the landmark dots
    ctx.shadowBlur = 0;
    
    // Draw landmarks with different colors for each finger (smaller circles)
    for (const landmark of landmarks) {
      // Use the drawCircle helper which handles the flipping
      drawCircle(
        landmark.x * scaleX,
        landmark.y * scaleY,
        landmark.index === 0 ? 5 : 3, // Much smaller radius for better visibility
        getLandmarkColor(landmark.index)
      );
    }
    
    // Draw intermediate points (even smaller than main landmark points)
    for (const point of intermediatePoints) {
      // No need to flip here as the points are already calculated with flipped coordinates
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = point.color;
      ctx.fill();
      
      // Add a thin white border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
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
      // Note: we don't flip the processing canvas as the API processes it correctly as is
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas image to base64 (removing the data:image/png;base64, prefix)
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      // Send to ASL Recognition API
      const result = await aslRecognitionApi.detectSign(imageBase64);
      
      console.log("API response:", result);
      
      if (result.has_hand) {
        console.log("Hand detected with", result.landmarks.length, "landmarks");
        setDetectedSign(result.sign);
        setConfidence(result.confidence);
        setLandmarks(result.landmarks);
        setError(null);
      } else {
        // Only clear sign if no hand is detected
        console.log("No hand detected in the frame");
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
      <div className="video-section">
        <div className="video-container">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-video"
          />
          <canvas 
            ref={canvasRef}
            className="landmark-canvas"
          />
          <canvas 
            ref={processingCanvasRef}
            style={{ display: 'none' }}
          />
          <div className="debug-overlay">
            <div>API: {apiStatus}</div>
          </div>
        </div>
      </div>
      
      <div className="info-section">
        {apiStatus === 'offline' && (
          <div className="alert alert-danger">
            API is offline
          </div>
        )}
        
        {error && (
          <div className="alert alert-warning">
            {error}
          </div>
        )}
        
        <div className={`result-container ${detectedSign ? 'with-letter' : ''}`}>
          <div className="result">
            <div className="letter-display">
              {detectedSign ? (
                <>
                  <div className="detected-sign">{getDisplayText(detectedSign)}</div>
                </>
              ) : (
                <>
                  <div className="empty-sign">Waiting for hand sign...</div>
                  <div className="hand-preference">Use right hand</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced sentence building section */}
        <div className="sentence-section">
          <div className="sentence-status">
            <div className={`sentence-mode ${buildingSentence ? 'active' : 'inactive'}`}>
              {buildingSentence ? 'Building Sentence: Active' : 'Building Sentence: Inactive'}
            </div>
            <div className="sentence-info">
              Press 'S' to {buildingSentence ? 'stop' : 'start'} building a sentence
              {buildingSentence && ' • Press C to clear'}
            </div>
          </div>
          
          {buildingSentence && (
            <>
              <div className="current-sentence-container">
                <div className="current-sentence">
                  {currentSentence ? (
                    <span className="sentence-text">{currentSentence}</span>
                  ) : (
                    <span className="sentence-placeholder">Your sentence will appear here</span>
                  )}
                </div>
              </div>
              
              {detectedSign && (
                <div className="sign-hold-progress">
                  <div className="progress-label">
                    Holding: <span className="current-hold-sign">{getDisplayText(detectedSign)}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${signHoldProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="landmarks-info">
          <h3>Hand Tracking</h3>
          <div className="landmarks-status">
            {landmarks.length > 0 ? (
              <span className="landmarks-active">Active - Hand Detected</span>
            ) : (
              <span className="landmarks-inactive">No hand detected</span>
            )}
          </div>
          {landmarks.length > 0 && (
            <>
              {confidence !== null && (
                <div className="confidence">
                  Confidence: {(confidence * 100).toFixed(0)}%
                </div>
              )}
              <div className="landmark-count">Tracking {landmarks.length} landmarks</div>
            </>
          )}
        </div>

        <div className="instructions">
          <h3>How to Use</h3>
          <ol>
            <li>Position your hand in camera view</li>
            <li>Make a clear ASL sign</li>
            <li>Hold steady for best results</li>
            <li>Press 'S' to start/stop building a sentence</li>
            <li>Hold a sign for 1 second to add it to your sentence</li>
            <li>Press 'C' to clear your sentence</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DetectionPage;