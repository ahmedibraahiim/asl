# ASL Recognition API

A FastAPI-based API for recognizing American Sign Language (ASL) signs from images.

## Features

- Detect hands in images using MediaPipe
- Extract and normalize hand landmarks
- Predict ASL signs using a trained machine learning model
- Supports both file upload and base64-encoded image inputs
- Health check endpoint

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Make sure the model file exists at `asl_recognition/data/asl_model.pkl`. If not, you'll need to train it first.

## Running the API Server

```bash
python -m asl_recognition.run_api
```

The API will be available at `http://localhost:8000`. You can also access the interactive API documentation at `http://localhost:8000/docs`.

## API Endpoints

### Health Check

```
GET /health
```

Returns the current health status of the API and whether the model is loaded.

### Predict from File Upload

```
POST /predict
```

Upload an image file to get a prediction of the ASL sign.

### Predict from Base64-Encoded Image

```
POST /predict/base64
```

Send a base64-encoded image to get a prediction of the ASL sign.

## Testing the API

Use the provided test script:

```bash
python -m asl_recognition.test_api --image path/to/your/image.jpg
```

## Response Format

Successful predictions return a JSON response with:

```json
{
  "sign": "A",                 // Predicted ASL sign
  "confidence": 0.95,          // Confidence score (0-1)
  "has_hand": true,            // Whether a hand was detected
  "landmarks": [               // Array of hand landmarks (21 points)
    {
      "x": 0.5,
      "y": 0.5,
      "z": 0.0,
      "index": 0
    },
    ...
  ]
}
```

If no hand is detected, it returns:

```json
{
  "sign": "no_hand",
  "confidence": 0.0,
  "has_hand": false,
  "landmarks": []
}
```
