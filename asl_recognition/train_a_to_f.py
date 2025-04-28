import os
import sys
import numpy as np
from models.a_to_f_classifier import ASLAtoFClassifier
from utils.landmark_extraction import create_landmark_dataset

def main():
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
    all_data_X = []
    all_data_y = []
    label_mapping = {i: letter for i, letter in enumerate(target_letters)}
    
    for i, letter in enumerate(target_letters):
        letter_dir = os.path.join(train_dir, letter)
        
        if not os.path.exists(letter_dir):
            print(f"Warning: Directory for letter {letter} not found: {letter_dir}")
            continue
            
        print(f"Processing letter {letter} from {letter_dir}")
        
        # Count images
        image_files = [f for f in os.listdir(letter_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        print(f"Found {len(image_files)} images for letter {letter}")
        
        # Create temporary dataset for this letter
        temp_output_dir = os.path.join(output_dir, "temp")
        os.makedirs(temp_output_dir, exist_ok=True)
        
        temp_data_path = os.path.join(temp_output_dir, f"{letter}_landmarks.npz")
        
        # Create a single-letter dataset
        letter_mapping = {0: letter}
        letter_data_dir = os.path.dirname(letter_dir)
        
        # For the create_landmark_dataset function, we need to provide:
        # - A directory containing subdirectories (each subdirectory being a class)
        # - In this case, we'll create a mapping for just one letter
        single_letter_mapping = {i: letter}
        
        try:
            print(f"Extracting landmarks for letter {letter}...")
            X, y, failed = create_landmark_dataset(
                train_dir,  # The parent directory containing letter subdirectories
                temp_data_path,
                label_mapping={i: letter}  # Map this index to this letter
            )
            
            if X is not None and len(X) > 0:
                # Filter to only keep samples for this letter
                # The label value should match the key in our mapping that points to this letter
                target_label = None
                for key, val in label_mapping.items():
                    if val == letter:
                        target_label = key
                        break
                
                # Find all samples with label value matching this letter
                mask = np.where(y == i)
                letter_X = X[mask]
                letter_y = np.full(len(letter_X), i)  # Assign the index in our A-F sequence
                
                print(f"Extracted {len(letter_X)} samples for letter {letter}")
                
                # Save the samples
                all_data_X.append(letter_X)
                all_data_y.append(letter_y)
            else:
                print(f"No landmarks extracted for letter {letter}")
                
        except Exception as e:
            print(f"Error processing letter {letter}: {str(e)}")
    
    # Clean up temporary files
    if os.path.exists(temp_output_dir):
        for file in os.listdir(temp_output_dir):
            os.remove(os.path.join(temp_output_dir, file))
        os.rmdir(temp_output_dir)
    
    # Combine all data
    if all_data_X:
        X_combined = np.vstack(all_data_X)
        y_combined = np.concatenate(all_data_y)
        
        # Save the combined dataset
        a_to_f_data_path = os.path.join(output_dir, 'a_to_f_landmarks.npz')
        np.savez(a_to_f_data_path, 
                X=X_combined, 
                y=y_combined, 
                label_mapping=label_mapping)
        
        print(f"Created dataset with {len(X_combined)} samples")
        
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