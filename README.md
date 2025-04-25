# ASL Learning Platform

<div align="center">
  <img src="ASL.Frontend/public/logo.png" alt="ASL Learning Platform Logo" width="200"/>
  <br />
  <h3>Learn American Sign Language through interactive experiences</h3>
  <p>A modern web application to help users learn and practice American Sign Language</p>
  
  ![Version](https://img.shields.io/badge/version-1.0.0-blue)
  ![License](https://img.shields.io/badge/license-MIT-green)
  ![Framework](https://img.shields.io/badge/framework-React-61DAFB)
  ![Backend](https://img.shields.io/badge/backend-.NET%20Core-512BD4)
</div>

## 📋 Overview

The ASL Learning Platform is a comprehensive tool designed to make learning American Sign Language accessible and engaging. The application combines visual recognition technology with interactive learning modules to create an immersive educational experience.

### ✨ Key Features

- **Interactive Dictionary**: Browse and learn all ASL letters and common signs with visual references and video demonstrations
- **Practice Mode**: Test your knowledge with real-time feedback through webcam recognition
- **Learning Modules**: Structured lessons that guide users from basics to advanced conversations
- **Progress Tracking**: Monitor your improvement over time with detailed statistics
- **Community Features**: Share progress and connect with other learners

## 🏗️ Project Structure

The project consists of two main components:

```
asl-learning-platform/
├── ASL.Frontend/     # React-based user interface
├── ASL.Backend/      # .NET Core API and ML services
└── docs/             # Documentation and development guides
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- .NET 6.0 SDK
- Git

### Installation

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd ASL.Frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:3000`.

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd ASL.Backend
```

2. Restore dependencies:

```bash
dotnet restore
```

3. Start the API server:

```bash
dotnet run
```

The API will be available at `https://localhost:7001`.

## 🧠 ASL Recognition System

The machine learning component is crucial for providing real-time sign detection and feedback. We've implemented several key improvements to handle all ASL letters accurately, particularly the challenging dynamic signs (J and Z).

### Recognition Improvements

#### Motion-based Approach

To accurately recognize dynamic signs like 'J' and 'Z' that require movement:

- **Motion Feature Extraction**: Extract delta positions between consecutive frames to capture hand movements
- **Temporal Patterns**: Encode the trajectory patterns that distinguish each dynamic letter
- **Acceleration Features**: Include acceleration data to better distinguish between similar movements

```python
# Example: Computing motion features between frames
def compute_motion_features(landmarks_sequence):
    motion_features = []
    for i in range(1, len(landmarks_sequence)):
        # Calculate delta positions
        deltas = landmarks_sequence[i] - landmarks_sequence[i-1]
        motion_features.append(deltas)
    return motion_features
```

#### Time Window Approach

Instead of single-frame classification:

- Use sliding windows of 5-10 frames for all predictions
- Apply weighted averaging to emphasize recent frames
- Implement majority voting for more stable predictions

#### Model Specialization

We've split the recognition model into specialized sub-models for improved accuracy:

1. **General Recognition Model**: Handles basic letter classification
2. **Dynamic Signs Model**: Specialized for motion-based signs (J, Z)
3. **Exercise-Specific Models**: Tailored to specific learning modules for higher accuracy

### Model Retraining Process

To improve recognition, especially for J and Z:

1. Collect specialized datasets focusing on proper motion for dynamic signs
2. Integrate time-series data augmentation techniques
3. Use cross-validation to ensure robustness across different users
4. Implement a feedback loop where user corrections improve the model over time

## 💻 Frontend Implementation Guide

### Player vs. Player Functionality

The PvP mode allows users to compete and practice ASL together:

- **Real-time Challenges**: Users can challenge each other to sign specific words or phrases
- **Scoring System**: Points awarded based on accuracy and speed
- **Leaderboards**: Track top performers across different categories

Implementation steps:

1. Create a matchmaking system using WebSockets for real-time communication
2. Implement a lobby system for users to find and challenge others
3. Develop a round-based game flow with alternating turns
4. Add a spectator mode for learning from other players

```javascript
// Example: Basic WebSocket setup for PvP
const initializePvPMode = () => {
  const socket = new WebSocket("wss://api.asllearning.com/pvp");

  socket.onopen = () => {
    console.log("Connected to PvP server");
    socket.send(
      JSON.stringify({ action: "join_lobby", userId: currentUser.id })
    );
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handlePvPEvent(data);
  };
};
```

### Model Integration

To integrate the various recognition models into the frontend:

1. **Model Manager Component**: Handles loading and switching between models based on context
2. **WebWorker Implementation**: Run predictions in a separate thread to maintain UI responsiveness
3. **Adaptive Loading**: Dynamically load only the models needed for the current exercise

```typescript
// Example: Simplified model manager
class ASLModelManager {
  private models: {
    general: ASLModel;
    dynamic: ASLModel;
    exercises: Record<string, ASLModel>;
  };

  async loadModels() {
    this.models = {
      general: await tf.loadLayersModel("models/general/model.json"),
      dynamic: await tf.loadLayersModel("models/dynamic/model.json"),
      exercises: {},
    };
  }

  async loadExerciseModel(exerciseId: string) {
    this.models.exercises[exerciseId] = await tf.loadLayersModel(
      `models/exercises/${exerciseId}/model.json`
    );
  }

  predictSign(landmarks: any[], context: "general" | "dynamic" | string) {
    // Select appropriate model based on context
    const model =
      context === "general"
        ? this.models.general
        : context === "dynamic"
        ? this.models.dynamic
        : this.models.exercises[context];

    return model.predict(landmarks);
  }
}
```

### Exercise Implementation

Structure for implementing the practice exercises:

1. **Exercise Framework**: Consistent UI pattern for all exercise types
2. **Difficulty Progression**: Automatically adjust difficulty based on user performance
3. **Feedback Mechanisms**: Visual guides showing hand positioning corrections
4. **Achievements System**: Unlock badges and rewards for completing challenges

```typescript
// Example: Exercise component structure
interface ExerciseProps {
  type: "alphabet" | "words" | "phrases";
  difficulty: "beginner" | "intermediate" | "advanced";
  modelContext: string;
}

const Exercise: React.FC<ExerciseProps> = ({
  type,
  difficulty,
  modelContext,
}) => {
  // Implementation details
};
```

## 🔧 Development

### Frontend (React)

The frontend is built with:

- React for UI components
- TypeScript for type safety
- CSS Modules for styling
- React Router for navigation
- Context API for state management

Key directories:

- `/src/components` - Reusable UI components
- `/src/pages` - Page-level components
- `/src/services` - API communication and utilities
- `/src/hooks` - Custom React hooks

### Backend (.NET Core)

The backend provides:

- RESTful API for data retrieval
- Machine learning services for sign recognition
- User data storage and authentication
- Progress tracking and analytics

Key components:

- `ASL.API` - Web API endpoints
- `ASL.Core` - Business logic and services
- `ASL.Data` - Data access and models
- `ASL.ML` - Machine learning models for sign recognition

## 📱 Features in Detail

### ASL Dictionary

Our comprehensive dictionary includes:

- All 26 letters of the alphabet
- Common words and phrases
- Detailed hand positioning guides
- Video demonstrations of proper signing techniques

### Practice Mode

The interactive practice mode allows users to:

- Use their webcam to practice signs
- Receive real-time feedback on accuracy
- Track improvement over time
- Practice specific letters or full words

### Learning Modules

Structured lessons for all experience levels:

- Beginner: Alphabet and basic signs
- Intermediate: Common phrases and conversations
- Advanced: Fluid signing and complex expressions

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions, feedback, or support:

- **Email**: support@asllearning.com
- **GitHub Issues**: For bug reports and feature requests
- **Twitter**: [@ASLLearningPlatform](https://twitter.com/ASLLearningPlatform)

---

<div align="center">
  <p>Made with ❤️ for the ASL community</p>
</div>
