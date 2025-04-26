#!/usr/bin/env python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import base64
import random
import math

# Initialize FastAPI app
app = FastAPI(
    title="Simple ASL Recognition API",
    description="Simple API for testing ASL recognition integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class PredictionResponse(BaseModel):
    sign: str
    confidence: float
    has_hand: bool
    landmarks: list

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool

# Health endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": True
    }

# Request model
class Base64ImageRequest(BaseModel):
    image: str

# Generate synthetic hand landmarks for visualization
def generate_landmarks(sign):
    # Basic hand layout - this is a simplified model of a hand in neutral position
    base_landmarks = [
        # Wrist
        {"x": 0.5, "y": 0.8, "z": 0.0, "index": 0},
        
        # Thumb
        {"x": 0.4, "y": 0.75, "z": 0.0, "index": 1},  # CMC
        {"x": 0.35, "y": 0.7, "z": 0.0, "index": 2},  # MCP
        {"x": 0.3, "y": 0.67, "z": 0.0, "index": 3},  # IP
        {"x": 0.25, "y": 0.65, "z": 0.0, "index": 4},  # TIP
        
        # Index finger
        {"x": 0.45, "y": 0.6, "z": 0.0, "index": 5},  # MCP
        {"x": 0.45, "y": 0.5, "z": 0.0, "index": 6},  # PIP
        {"x": 0.45, "y": 0.4, "z": 0.0, "index": 7},  # DIP
        {"x": 0.45, "y": 0.3, "z": 0.0, "index": 8},  # TIP
        
        # Middle finger
        {"x": 0.5, "y": 0.58, "z": 0.0, "index": 9},  # MCP
        {"x": 0.5, "y": 0.46, "z": 0.0, "index": 10}, # PIP
        {"x": 0.5, "y": 0.36, "z": 0.0, "index": 11}, # DIP
        {"x": 0.5, "y": 0.26, "z": 0.0, "index": 12}, # TIP
        
        # Ring finger
        {"x": 0.55, "y": 0.6, "z": 0.0, "index": 13}, # MCP
        {"x": 0.55, "y": 0.5, "z": 0.0, "index": 14}, # PIP
        {"x": 0.55, "y": 0.4, "z": 0.0, "index": 15}, # DIP
        {"x": 0.55, "y": 0.3, "z": 0.0, "index": 16}, # TIP
        
        # Pinky
        {"x": 0.6, "y": 0.62, "z": 0.0, "index": 17}, # MCP
        {"x": 0.6, "y": 0.54, "z": 0.0, "index": 18}, # PIP
        {"x": 0.6, "y": 0.46, "z": 0.0, "index": 19}, # DIP
        {"x": 0.6, "y": 0.38, "z": 0.0, "index": 20}, # TIP
    ]
    
    # Add some variation based on the sign
    # Different hand shapes for different letter signs
    if sign in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']:
        # Use the first letter of the sign to seed the random generator 
        # for consistent shapes for the same letter
        random.seed(ord(sign[0]))
        
        # Apply different modifications based on the sign
        if sign == 'A':  # Fist with thumb alongside
            # Close all fingers to a fist except thumb
            for i in range(5, 21):  # All fingers except thumb
                base_landmarks[i]["y"] += 0.2  # Move towards palm
            # Adjust thumb
            for i in range(1, 5):
                base_landmarks[i]["x"] += 0.05  # Move thumb alongside
        
        elif sign == 'B':  # Flat hand, fingers together
            # Straighten all fingers
            for i in range(5, 21):
                # Align x positions within each finger
                finger_base = (i - 5) // 4 + 5
                base_landmarks[i]["x"] = base_landmarks[finger_base]["x"]
            
        elif sign == 'C':  # Curved hand
            # Create a C shape
            for i in range(1, 21):
                angle = math.pi * 0.7 * (i / 20.0)
                radius = 0.3
                base_landmarks[i]["x"] = 0.5 + radius * math.cos(angle)
                base_landmarks[i]["y"] = 0.5 + radius * math.sin(angle)
        
        # Add slightly different variations for other letters
        else:
            # Apply small random variations to make it look more natural
            for landmark in base_landmarks:
                landmark["x"] += random.uniform(-0.05, 0.05)
                landmark["y"] += random.uniform(-0.05, 0.05)
                landmark["z"] += random.uniform(-0.01, 0.01)
    
    # Add small random noise to make movement look natural
    for landmark in base_landmarks:
        landmark["x"] += random.uniform(-0.01, 0.01)
        landmark["y"] += random.uniform(-0.01, 0.01)
        landmark["z"] += random.uniform(-0.005, 0.005)
        
        # Ensure values stay in reasonable range
        landmark["x"] = max(0.1, min(0.9, landmark["x"]))
        landmark["y"] = max(0.1, min(0.9, landmark["y"]))
        landmark["z"] = max(-0.1, min(0.1, landmark["z"]))
    
    return base_landmarks

# Prediction endpoint
@app.post("/predict/base64", response_model=PredictionResponse)
async def predict_sign_base64(request: Base64ImageRequest):
    try:
        # Validate base64 string (just check if it's valid)
        try:
            base64.b64decode(request.image)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image")
        
        # Simulate processing - randomly choose a sign
        asl_signs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                    'thank you', 'hello', 'love', 'yes', 'no']
        
        sign = random.choice(asl_signs)
        confidence = random.uniform(0.7, 0.99)
        
        # Generate hand landmarks for visualization
        landmarks = generate_landmarks(sign)
        
        return {
            "sign": sign,
            "confidence": confidence,
            "has_hand": True,
            "landmarks": landmarks
        }
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Run the server
if __name__ == "__main__":
    uvicorn.run("simple_api:app", host="0.0.0.0", port=8000, reload=True) 