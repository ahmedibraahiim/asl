import os
import numpy as np
import argparse
from asl_recognition.utils.landmark_extraction import create_landmark_dataset
from asl_recognition.models.a_to_f_classifier import ASLAtoFClassifier

def main():
    parser = argparse.ArgumentParser(description='Train ASL A-to-F recognition model')
    parser.add_argument('--train_dir', type=str, default='asl_dataset/asl_alphabet_train/asl_alphabet_train',
                        help='Directory containing training images')
    parser.add_argument('--test_dir', type=str, default='asl_dataset/asl_alphabet_test/asl_alphabet_test',
                        help='Directory containing test images')
    parser.add_argument('--output_dir', type=str, default='asl_recognition/data',
                        help='Directory to save model and dataset')
    parser.add_argument('--extract_landmarks', action='store_true',
                        help='Extract landmarks from images')
    parser.add_argument('--tune_hyperparams', action='store_true',
                        help='Tune hyperparameters')
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    train_data_path = os.path.join(args.output_dir, 'train_landmarks.npz')
    
    # Extract landmarks from training images if requested or if they don't exist yet
    if args.extract_landmarks or not os.path.exists(train_data_path):
        print("Extracting landmarks from training images...")
        X_train, y_train, failed_train = create_landmark_dataset(
            args.train_dir, train_data_path)
    else:
        # Load pre-extracted landmarks
        print("Loading pre-extracted landmarks...")
        data = np.load(train_data_path, allow_pickle=True)
        X_train = data['X']
        y_train = data['y']
        label_mapping = data['label_mapping'].item()
        print(f"Loaded {len(X_train)} training samples.")
    
    # Train the specialized A-to-F classifier
    print("Training the A-to-F classifier...")
    classifier = ASLAtoFClassifier()
    
    # Load label mapping from the training data
    data = np.load(train_data_path, allow_pickle=True)
    label_mapping = data['label_mapping'].item()
    
    classifier.train(X_train, y_train, 
                    label_mapping=label_mapping, 
                    tune_hyperparams=args.tune_hyperparams)
    
    # Save the model
    model_path = os.path.join(args.output_dir, 'asl_a_to_f_model.pkl')
    classifier.save(model_path)
    
    print("Training complete!")

if __name__ == "__main__":
    main() 