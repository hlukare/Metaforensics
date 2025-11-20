import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import cv2
import numpy as np
import tensorflow as tf
import json
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="tensorflow.lite.python.interpreter")

# Load FaceNet model
interpreter = tf.lite.Interpreter(model_path="mobilefacenet.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Load Haarcascade for face detection
# face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

try:
    haarcascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
except AttributeError:
    haarcascade_path = os.path.join(os.path.dirname(__file__), "haarcascade_frontalface_default.xml")

face_cascade = cv2.CascadeClassifier(haarcascade_path)          

def preprocess_face(face):
    face = tf.image.resize(face, [112, 112])
    face = tf.cast(face, tf.float32) / 255.0
    face = tf.expand_dims(face, axis=0)
    return face

def extract_face_embedding(face):
    face = preprocess_face(face)
    face_numpy = face.numpy()
    interpreter.set_tensor(input_details[0]['index'], face_numpy)
    interpreter.invoke()
    embedding = interpreter.get_tensor(output_details[0]['index']).flatten()
    # Normalize the embedding
    embedding = embedding / np.linalg.norm(embedding)
    return embedding


def cosine_similarity(emb1, emb2):
    emb1_tensor = tf.constant(emb1, dtype=tf.float32)
    emb2_tensor = tf.constant(emb2, dtype=tf.float32)
    dot_product = tf.reduce_sum(emb1_tensor * emb2_tensor)
    norm_product = tf.norm(emb1_tensor) * tf.norm(emb2_tensor)
    return (dot_product / norm_product).numpy()


def load_face_database():
    try:
        with open("face_database.json", 'r') as f:
            return json.load(f)
    except:
        return None


def detect_and_extract_face_from_path(image_path):
    try:
        image = cv2.imread(image_path)
        if image is None:
            return None, f"Could not read image file"
            
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            return None, "No face detected"
        elif len(faces) > 1:
            faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
        
        x, y, w, h = faces[0]
        face = image[y:y + h, x:x + w]
        embedding = extract_face_embedding(face)
        return embedding, "Success"
        
    except Exception as e:
        return None, f"Error: {str(e)}"


def find_best_match(test_embedding, database, threshold=0.6):
    best_match = None
    best_similarity = -1
    
    for name, stored_embedding in database.items():
        similarity = cosine_similarity(test_embedding, stored_embedding)
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = name
    
    return (best_match, best_similarity) if best_similarity > threshold else (None, best_similarity)


def authenticate_from_json(input_data):
    try:
        if not isinstance(input_data, dict):
            return {"name": None, "location": ""}
        
        required_fields = ["image_path", "location"]
        for field in required_fields:
            if field not in input_data:
                return {
                    "name": None,
                    "location": input_data.get("location", "")
                }
        
        image_path = input_data["image_path"]
        location = input_data["location"]
        
        if not os.path.exists(image_path):
            return {"name": None, "location": location}
        
        database = load_face_database()
        if not database:
            return {"name": None, "location": location}
        
        embedding, message = detect_and_extract_face_from_path(image_path)
        if embedding is None:
            return {"name": None, "location": location}
        
        # match_name, similarity = find_best_match(embedding, database)
        
        # return {"name": match_name, "location": location}
        match_name, similarity = find_best_match(embedding, database, threshold=0.3)
        print(f"[DEBUG] Best match: {match_name}, Similarity: {similarity}")

        return {"name": match_name, "location": location}
    except Exception as e:
        return {
            "name": None,
            "location": input_data.get("location", "") if isinstance(input_data, dict) else ""
        }


