import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import pickle
import os

class ASLAtoFClassifier:
    """
    A specialized classifier for American Sign Language letters A to F based on hand landmarks.
    """
    
    def __init__(self, model_type='random_forest'):
        """
        Initialize the classifier.
        
        Args:
            model_type: Type of model to use. Currently only 'random_forest' is supported.
        """
        self.model_type = model_type
        
        if model_type == 'random_forest':
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        self.label_mapping = None
        self.reverse_mapping = None
        self.letters = ['A', 'B', 'C', 'D', 'E', 'F']
    
    def train(self, X, y, label_mapping=None, tune_hyperparams=False):
        """
        Train the classifier.
        
        Args:
            X: numpy array of landmarks
            y: numpy array of labels
            label_mapping: Dictionary mapping label indices to label names
            tune_hyperparams: Whether to tune hyperparameters
        
        Returns:
            Trained model
        """
        # Filter data for A-F only
        if label_mapping:
            # Create a mapping of indices for A-F
            a_to_f_indices = []
            a_to_f_mapping = {}
            new_idx = 0
            
            for letter in self.letters:
                if letter in label_mapping.values():
                    for idx, label in label_mapping.items():
                        if label == letter:
                            a_to_f_indices.append(idx)
                            a_to_f_mapping[idx] = new_idx
                            new_idx += 1
            
            # Filter data
            mask = np.isin(y, a_to_f_indices)
            X = X[mask]
            
            # Map original labels to new consecutive labels
            new_y = np.array([a_to_f_mapping[label] for label in y[mask]])
            y = new_y
            
            # Create new label_mapping
            self.label_mapping = {i: self.letters[i] for i in range(len(self.letters))}
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Save label mapping
        if not self.label_mapping:
            self.label_mapping = label_mapping
        
        if self.label_mapping:
            self.reverse_mapping = {v: k for k, v in self.label_mapping.items()}
        
        # Hyperparameter tuning
        if tune_hyperparams and self.model_type == 'random_forest':
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [None, 10, 20, 30],
                'min_samples_split': [2, 5, 10]
            }
            
            grid_search = GridSearchCV(
                self.model, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
            grid_search.fit(X_train, y_train)
            
            print(f"Best parameters: {grid_search.best_params_}")
            self.model = grid_search.best_estimator_
        else:
            # Train model
            self.model.fit(X_train, y_train)
        
        # Evaluate on validation set
        val_accuracy = self.model.score(X_val, y_val)
        print(f"Validation accuracy: {val_accuracy:.4f}")
        
        # Detailed evaluation
        y_pred = self.model.predict(X_val)
        print("\nClassification Report:")
        print(classification_report(y_val, y_pred))
        
        return self.model
    
    def evaluate(self, X, y):
        """
        Evaluate the classifier on a test set.
        
        Args:
            X: numpy array of landmarks
            y: numpy array of labels
        
        Returns:
            accuracy: accuracy score
        """
        if self.model is None:
            raise ValueError("Model has not been trained yet.")
        
        # Predict
        y_pred = self.model.predict(X)
        
        # Calculate accuracy
        accuracy = (y_pred == y).mean()
        
        # Print report
        print(f"Test accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y, y_pred))
        
        # Plot confusion matrix
        self.plot_confusion_matrix(y, y_pred)
        
        return accuracy
    
    def predict(self, landmarks):
        """
        Predict the label for a set of landmarks.
        
        Args:
            landmarks: numpy array of landmarks
        
        Returns:
            label: predicted label (one of A-F)
            confidence: prediction confidence
        """
        try:
            if self.model is None:
                raise ValueError("Model has not been trained yet.")
            
            # Ensure landmarks is 2D
            if landmarks.ndim == 1:
                landmarks = landmarks.reshape(1, -1)
            
            # Print landmark shape for debugging
            print(f"Landmarks shape for prediction: {landmarks.shape}")
            
            # Predict
            label_idx = self.model.predict(landmarks)[0]
            print(f"Predicted label_idx: {label_idx}")
            
            # Get probabilities
            proba = self.model.predict_proba(landmarks)[0]
            confidence = proba[label_idx]
            
            # Get label name
            if self.reverse_mapping:
                # Check if the label_idx exists in the reverse mapping
                if label_idx in self.reverse_mapping:
                    label = self.reverse_mapping[label_idx]
                else:
                    # If not found, return as string
                    label = str(label_idx)
                    print(f"Warning: label_idx {label_idx} not found in mapping, using as is")
            else:
                # If no mapping, just return the index as a string
                label = str(label_idx)
            
            print(f"Final predicted label: {label} with confidence {confidence}")
            return label, confidence
        except Exception as e:
            print(f"Error in predict method: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return a default value as fallback
            return "error", 0.0
    
    def save(self, model_path):
        """
        Save the model to a file.
        
        Args:
            model_path: Path to save the model
        """
        if self.model is None:
            raise ValueError("Model has not been trained yet.")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save model and label mapping
        with open(model_path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'label_mapping': self.label_mapping
            }, f)
        
        print(f"Model saved to {model_path}")
    
    def load(self, model_path):
        """
        Load a model from a file.
        
        Args:
            model_path: Path to the model file
        """
        try:
            with open(model_path, 'rb') as f:
                data = pickle.load(f)
            
            # Handle different formats of saved models
            if isinstance(data, dict):
                if 'model' in data:
                    self.model = data['model']
                if 'label_mapping' in data:
                    self.label_mapping = data['label_mapping']
            else:
                # Direct model without dict wrapping
                self.model = data
            
            # Create reverse mapping if label mapping exists
            if self.label_mapping:
                self.reverse_mapping = {v: k for k, v in self.label_mapping.items()}
            
            print(f"Model loaded from {model_path}")
            
            # Print model info for debugging
            if hasattr(self.model, 'n_estimators'):
                print(f"Random Forest model with {self.model.n_estimators} trees")
            if self.label_mapping:
                print(f"Label mapping: {self.label_mapping}")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def plot_confusion_matrix(self, y_true, y_pred):
        """
        Plot a confusion matrix.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
        """
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(10, 8))
        plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
        plt.title("Confusion Matrix")
        plt.colorbar()
        
        # Add labels
        if self.reverse_mapping:
            classes = [self.reverse_mapping[i] for i in sorted(self.reverse_mapping.keys())]
            tick_marks = np.arange(len(classes))
            plt.xticks(tick_marks, classes, rotation=90)
            plt.yticks(tick_marks, classes)
        
        # Add values to the plot
        thresh = cm.max() / 2.
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                plt.text(j, i, format(cm[i, j], 'd'),
                         horizontalalignment="center",
                         color="white" if cm[i, j] > thresh else "black")
        
        plt.tight_layout()
        plt.ylabel('True label')
        plt.xlabel('Predicted label')
        plt.show()
    
    def feature_importance(self):
        """
        Get feature importance (for tree-based models).
        
        Returns:
            feature_importance: Array of feature importance scores
        """
        if self.model_type != 'random_forest':
            raise ValueError("Feature importance is only available for tree-based models.")
        
        return self.model.feature_importances_ 