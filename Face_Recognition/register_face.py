import os
import warnings
# Set environment variables before importing TensorFlow
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import cv2
import numpy as np
import tensorflow as tf
import time
import json
from pathlib import Path

# Suppress TensorFlow Lite deprecation warnings
warnings.filterwarnings("ignore", category=UserWarning, module="tensorflow.lite.python.interpreter")

# Load FaceNet model
MODEL_PATH = "mobilefacenet.tflite"
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Load Haarcascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def preprocess_face(face):
    # Convert to tensor if not already
    face = tf.image.resize(face, [112, 112])
    face = tf.cast(face, tf.float32) / 255.0
    face = tf.expand_dims(face, axis=0)
    return face


def extract_face_embedding(face):
    face = preprocess_face(face)
    # Convert tensor to numpy array for TFLite interpreter
    face_numpy = face.numpy()
    interpreter.set_tensor(input_details[0]['index'], face_numpy)
    interpreter.invoke()
    embedding = interpreter.get_tensor(output_details[0]['index'])
    return embedding.flatten()


def detect_and_extract_face(image_path):
    """Detect face in image and extract embedding."""
    try:
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            print(f"Error: Could not read image {image_path}")
            return None
            
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            print(f"Warning: No face detected in {image_path}")
            return None
        elif len(faces) > 1:
            print(f"Warning: Multiple faces detected in {image_path}, using the largest one")
            # Get the largest face
            faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
        
        # Extract the first (or largest) face
        x, y, w, h = faces[0]
        face = image[y:y + h, x:x + w]
        
        # Extract embedding
        embedding = extract_face_embedding(face)
        return embedding
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None


def get_supported_image_extensions():
    """Return list of supported image file extensions."""
    return ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.tif']


def find_image_in_folder(folder_path):
    """Find the first image file in a folder."""
    folder = Path(folder_path)
    supported_extensions = get_supported_image_extensions()
    
    for file_path in folder.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            return str(file_path)
    
    return None


def register_faces_from_dataset(dataset_path="faces_dataset"):
    """Register all faces from the dataset directory."""
    dataset_dir = Path(dataset_path)
    
    if not dataset_dir.exists():
        print(f"Error: Dataset directory '{dataset_path}' not found.")
        return {}
    
    print(f"Processing faces from dataset: {dataset_path}")
    print("=" * 50)
    
    registered_faces = {}
    success_count = 0
    total_folders = 0
    
    # Process each folder in the dataset
    for person_folder in dataset_dir.iterdir():
        if not person_folder.is_dir():
            continue
            
        total_folders += 1
        person_name = person_folder.name
        
        print(f"Processing: {person_name}")
        
        # Find image in the folder
        image_path = find_image_in_folder(person_folder)
        
        if image_path is None:
            print(f"  ❌ No supported image found in {person_folder}")
            continue
        
        print(f"  📁 Found image: {Path(image_path).name}")
        
        # Extract face embedding
        embedding = detect_and_extract_face(image_path)
        
        if embedding is not None:
            registered_faces[person_name] = embedding.tolist()
            success_count += 1
            print(f"  ✅ Successfully registered {person_name}")
        else:
            print(f"  ❌ Failed to register {person_name}")
        
        print()
    
    print("=" * 50)
    print(f"Registration Summary:")
    print(f"Total folders processed: {total_folders}")
    print(f"Successfully registered: {success_count}")
    print(f"Failed: {total_folders - success_count}")
    
    return registered_faces


def save_face_database(database, db_file="face_database.json"):
    """Save face database to a file."""
    if not database:
        print("Error: No face data to save.")
        return False
        
    try:
        with open(db_file, 'w') as f:
            json.dump(database, f, indent=2)
        print(f"\n✅ Face database saved to '{db_file}'")
        print(f"📊 Total registered faces: {len(database)}")
        return True
    except Exception as e:
        print(f"Error saving face database: {e}")
        return False


def load_existing_database(db_file="face_database.json"):
    """Load existing face database if it exists."""
    try:
        with open(db_file, 'r') as f:
            database = json.load(f)
        print(f"📂 Loaded existing database with {len(database)} faces")
        return database
    except FileNotFoundError:
        print("📂 No existing database found, creating new one")
        return {}
    except Exception as e:
        print(f"Error loading existing database: {e}")
        return {}


if __name__ == "__main__":
    print("=== Face Registration System (Dataset Mode) ===")
    print("This script will register all faces from the 'faces_dataset' directory")
    print()
    
    # Check if dataset directory exists
    dataset_path = "new_reg"
    if not Path(dataset_path).exists():
        print(f"❌ Error: '{dataset_path}' directory not found!")
        print("Please create the 'faces_dataset' directory and add person folders with images.")
        print("\nExpected structure:")
        print("faces_dataset/")
        print("├── person1/")
        print("│   └── image.jpg")
        print("├── person2/")
        print("│   └── photo.png")
        print("└── person3/")
        print("    └── picture.webp")
        exit(1)
    
    # Ask user if they want to merge with existing database
    db_file = "face_database.json"
    existing_db = load_existing_database(db_file)
    
    if existing_db:
        print(f"Found existing database with faces: {', '.join(existing_db.keys())}")
        choice = input("Do you want to merge with existing database? (y/n): ").strip().lower()
        if choice != 'y':
            existing_db = {}
            print("Starting fresh database")
    
    print()
    
    # Register faces from dataset
    new_faces = register_faces_from_dataset(dataset_path)
    
    if new_faces:
        # Merge with existing database
        final_database = {**existing_db, **new_faces}
        
        # Show what was updated
        if existing_db:
            updated_faces = set(new_faces.keys()) & set(existing_db.keys())
            if updated_faces:
                print(f"🔄 Updated existing faces: {', '.join(updated_faces)}")
        
        # Save the database
        if save_face_database(final_database, db_file):
            print(f"\n🎉 Registration complete!")
            print(f"📋 Final database contains: {', '.join(final_database.keys())}")
            print("You can now use authenticate_face.py to verify identities.")
        else:
            print("\n❌ Failed to save face database.")
    else:
        print("\n❌ No faces were successfully registered.")
        print("Please check your dataset and try again.")