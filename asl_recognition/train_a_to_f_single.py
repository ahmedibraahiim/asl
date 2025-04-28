import os
import numpy as np
import cv2
import mediapipe as mp
from tqdm import tqdm
from models.a_to_f_classifier import ASLAtoFClassifier

def extract_landmarks(image_path, hands):
    """Extract hand landmarks from a single image"""
    # Read image
    image = cv2.imread(image_path)
    if image is None:
        return None
    
    # Convert to RGB (MediaPipe requires RGB input)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process the image
    results = hands.process(image_rgb)
    
    # Check if hand landmarks are detected
    if results.multi_hand_landmarks:
        # Extract the first detected hand's landmarks
        landmarks = results.multi_hand_landmarks[0]
        
        # Convert landmarks to numpy array
        landmarks_array = np.zeros((21, 3))
        for i, landmark in enumerate(landmarks.landmark):
            landmarks_array[i] = [landmark.x, landmark.y, landmark.z]
        
        return landmarks_array
    
    # No hand detected
    return None

def normalize_landmarks(landmarks):
    """Normalize landmarks to make them translation and scale invariant"""
    if landmarks is None:
        return None
    
    # Get wrist position (landmark 0)
    wrist = landmarks[0]
    
    # Center landmarks on wrist
    centered = landmarks - wrist
    
    # Compute distance between wrist and middle finger MCP (landmark 9) for scaling
    scale = np.linalg.norm(centered[9])
    
    # Normalize by this scale
    if scale > 0:
        normalized = centered / scale
    else:
        normalized = centered
    
    # Flatten the array from (21, 3) to (63,)
    return normalized.flatten()

def main():
    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5
    )

    # Set up paths - using Windows-friendly path formatting
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    train_dir = os.path.join(base_dir, "asl_dataset", "asl_alphabet_train", "asl_alphabet_train")
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Define the target letters (A-F)
    target_letters = ['A', 'B', 'C', 'D', 'E', 'F']
    
    print(f"Training A-to-F ASL recognition model")
    print(f"Train directory: {train_dir}")
    print(f"Output directory: {output_dir}")
    
    # Verify the train directory exists
    if not os.path.exists(train_dir):
        print(f"Error: Training directory not found: {train_dir}")
        return
    
    # Process one letter at a time
    all_landmarks = []
    all_labels = []
    label_mapping = {i: letter for i, letter in enumerate(target_letters)}
    
    for i, letter in enumerate(target_letters):
        letter_dir = os.path.join(train_dir, letter)
        
        if not os.path.exists(letter_dir):
            print(f"Warning: Directory for letter {letter} not found: {letter_dir}")
            continue
            
        print(f"Processing letter {letter} from {letter_dir}")
        
        # Get all image files in the directory
        image_files = [f for f in os.listdir(letter_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        print(f"Found {len(image_files)} images for letter {letter}")
        
        # Process each image in this letter directory
        landmarks_list = []
        success_count = 0
        fail_count = 0
        
        print(f"Extracting landmarks for letter {letter}...")
        for img_file in tqdm(image_files):
            img_path = os.path.join(letter_dir, img_file)
            
            try:
                # Extract landmarks from the image
                landmarks = extract_landmarks(img_path, hands)
                
                if landmarks is not None:
                    # Normalize the landmarks
                    normalized = normalize_landmarks(landmarks)
                    
                    if normalized is not None:
                        landmarks_list.append(normalized)
                        success_count += 1
                    else:
                        fail_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                print(f"Error processing image {img_path}: {str(e)}")
                fail_count += 1
        
        print(f"Processed {success_count + fail_count} images for letter {letter}")
        print(f"Successfully extracted landmarks: {success_count}")
        print(f"Failed to extract landmarks: {fail_count}")
        
        if landmarks_list:
            # Convert list to numpy array
            letter_data = np.array(landmarks_list)
            letter_labels = np.full(len(landmarks_list), i)
            
            # Add to our collection
            all_landmarks.append(letter_data)
            all_labels.append(letter_labels)
            
            # Save interim results for this letter
            letter_data_path = os.path.join(output_dir, f"{letter}_landmarks.npz")
            np.savez(letter_data_path, 
                    X=letter_data, 
                    y=letter_labels,
                    letter=letter)
            print(f"Saved {len(letter_data)} samples for letter {letter} to {letter_data_path}")
    
    # Combine all data
    if all_landmarks:
        X_combined = np.vstack(all_landmarks)
        y_combined = np.concatenate(all_labels)
        
        # Save the combined dataset
        a_to_f_data_path = os.path.join(output_dir, 'a_to_f_landmarks.npz')
        np.savez(a_to_f_data_path, 
                X=X_combined, 
                y=y_combined, 
                label_mapping=label_mapping)
        
        print(f"Created combined dataset with {len(X_combined)} samples")
        
        # Train the classifier
        print("Training the A-to-F classifier...")
        classifier = ASLAtoFClassifier()
        
        # Train with our new dataset
        classifier.train(X_combined, y_combined, 
                        label_mapping=label_mapping, 
                        tune_hyperparams=False)
        
        # Save the model
        model_path = os.path.join(output_dir, 'asl_a_to_f_model.pkl')
        classifier.save(model_path)
        
        print("Training complete!")
        print(f"Model saved to {model_path}")
    else:
        print("No data could be processed. Check that the directories exist and contain images.")

if __name__ == "__main__":
    main() 