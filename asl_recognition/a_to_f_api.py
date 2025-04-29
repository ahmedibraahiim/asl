from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import mediapipe as mp
from io import BytesIO
import base64
import uvicorn
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import sys

# Add the parent directory to the path for direct execution
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Use relative imports when running as a module or absolute when running directly
try:
    from utils.landmark_extraction import extract_landmarks, normalize_landmarks
    from models.a_to_f_classifier import ASLAtoFClassifier
except ImportError:
    from asl_recognition.utils.landmark_extraction import extract_landmarks, normalize_landmarks
    from asl_recognition.models.a_to_f_classifier import ASLAtoFClassifier

# Initialize FastAPI app
app = FastAPI(
    title="ASL A-F Recognition API",
    description="API for recognizing American Sign Language signs A through F from images",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you may want to restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5  # Same as in api.py
)

# Initialize the ASL classifier
classifier = ASLAtoFClassifier()
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'data/asl_a_to_f_model.pkl')

# Load the model on startup
@app.on_event("startup")
async def startup_event():
    try:
        classifier.load(MODEL_PATH)
        print(f"Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
        # Continue without model, endpoints will handle errors

# Response models
class PredictionResponse(BaseModel):
    sign: str
    confidence: float
    landmarks: List[Dict[str, float]]
    has_hand: bool
    is_a_to_f: bool

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool

# Health endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    model_loaded = hasattr(classifier, 'model') and classifier.model is not None
    return {
        "status": "healthy",
        "model_loaded": model_loaded
    }

# Prediction endpoint for uploaded images
@app.post("/predict", response_model=PredictionResponse)
async def predict_sign(file: UploadFile = File(...)):
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Convert to RGB (MediaPipe requires RGB input)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image with MediaPipe
        results = hands.process(image_rgb)
        
        # Check if hand is detected
        if not results.multi_hand_landmarks:
            return {
                "sign": "no_hand",
                "confidence": 0.0,
                "landmarks": [],
                "has_hand": False,
                "is_a_to_f": False
            }
        
        # Extract landmarks
        landmarks_array = np.zeros((21, 3))
        for i, landmark in enumerate(results.multi_hand_landmarks[0].landmark):
            landmarks_array[i] = [landmark.x, landmark.y, landmark.z]
        
        # Normalize landmarks
        normalized_landmarks = normalize_landmarks(landmarks_array)
        
        # Make prediction
        try:
            if not hasattr(classifier, 'model') or classifier.model is None:
                print("ERROR: Model is not loaded properly")
                return {
                    "sign": "error",
                    "confidence": 0.0,
                    "landmarks": [],
                    "has_hand": True,
                    "is_a_to_f": False
                }
            
            print(f"Making prediction with normalized landmarks shape: {normalized_landmarks.shape}")
            label, confidence = classifier.predict(normalized_landmarks)
            
            # Handle numeric labels by converting to letters (0-5 -> A-F)
            if label.isdigit():
                num_label = int(label)
                if 0 <= num_label <= 5:
                    # Map 0->A, 1->B, 2->C, 3->D, 4->E, 5->F
                    letter_map = {0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F'}
                    label = letter_map[num_label]
                    print(f"Mapped numeric label {num_label} to letter {label}")
            
            # Check if the predicted sign is in A-F range
            is_a_to_f = label.upper() in ["A", "B", "C", "D", "E", "F"]
            print(f"Is A-F sign: {is_a_to_f}")
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "sign": "error",
                "confidence": 0.0,
                "landmarks": [],
                "has_hand": True,
                "is_a_to_f": False
            }
        
        # Format landmarks for response
        landmarks_list = []
        for i, landmark in enumerate(landmarks_array):
            landmarks_list.append({
                "x": float(landmark[0]),
                "y": float(landmark[1]),
                "z": float(landmark[2]),
                "index": i
            })
        
        return {
            "sign": label,
            "confidence": float(confidence),
            "landmarks": landmarks_list,
            "has_hand": True,
            "is_a_to_f": is_a_to_f
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Prediction from base64 encoded image
class Base64ImageRequest(BaseModel):
    image: str

@app.post("/predict/base64", response_model=PredictionResponse)
async def predict_sign_base64(request: Base64ImageRequest):
    try:
        # Decode base64 image - identical to api.py
        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Convert to RGB (MediaPipe requires RGB input)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image with MediaPipe
        results = hands.process(image_rgb)
        
        # Check if hand is detected
        if not results.multi_hand_landmarks:
            return {
                "sign": "no_hand",
                "confidence": 0.0,
                "landmarks": [],
                "has_hand": False,
                "is_a_to_f": False
            }
        
        # Extract landmarks
        landmarks_array = np.zeros((21, 3))
        for i, landmark in enumerate(results.multi_hand_landmarks[0].landmark):
            landmarks_array[i] = [landmark.x, landmark.y, landmark.z]
        
        # Normalize landmarks
        normalized_landmarks = normalize_landmarks(landmarks_array)
        
        # Make prediction
        try:
            if not hasattr(classifier, 'model') or classifier.model is None:
                print("ERROR: Model is not loaded properly")
                return {
                    "sign": "error",
                    "confidence": 0.0,
                    "landmarks": [],
                    "has_hand": True,
                    "is_a_to_f": False
                }
            
            print(f"Making prediction with normalized landmarks shape: {normalized_landmarks.shape}")
            label, confidence = classifier.predict(normalized_landmarks)
            
            # Handle numeric labels by converting to letters (0-5 -> A-F)
            if label.isdigit():
                num_label = int(label)
                if 0 <= num_label <= 5:
                    # Map 0->A, 1->B, 2->C, 3->D, 4->E, 5->F
                    letter_map = {0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F'}
                    label = letter_map[num_label]
                    print(f"Mapped numeric label {num_label} to letter {label}")
            
            # Check if the predicted sign is in A-F range
            is_a_to_f = label.upper() in ["A", "B", "C", "D", "E", "F"]
            print(f"Is A-F sign: {is_a_to_f}")
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "sign": "error",
                "confidence": 0.0,
                "landmarks": [],
                "has_hand": True,
                "is_a_to_f": False
            }
        
        # Format landmarks for response
        landmarks_list = []
        for i, landmark in enumerate(landmarks_array):
            landmarks_list.append({
                "x": float(landmark[0]),
                "y": float(landmark[1]),
                "z": float(landmark[2]),
                "index": i
            })
        
        return {
            "sign": label,
            "confidence": float(confidence),
            "landmarks": landmarks_list,
            "has_hand": True,
            "is_a_to_f": is_a_to_f
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Run the server
if __name__ == "__main__":
    import os
    import sys
    
    # Add the parent directory to the path for direct execution
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.append(parent_dir)
        print(f"Added {parent_dir} to Python path")
    
    print(f"Starting A-to-F API server on http://0.0.0.0:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)