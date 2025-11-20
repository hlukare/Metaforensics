import os
import sys
import tempfile
import logging
import json
import requests
from flask import Flask, request, jsonify
from authenticate_face import authenticate_from_json, detect_and_extract_face_from_path
import cv2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Add metadata folder to path to import extract module
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'metadata'))
from extract import get_image_metadata

# Setup Flask app
app = Flask(__name__)

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

# Load configuration from environment variables
NODE_SERVER_URL = os.getenv('NODE_SERVER_URL', 'http://localhost:3000/api/search')
API_KEY = os.getenv('API_KEY')

if not API_KEY:
    logging.warning("API_KEY not found in environment variables. Authentication may fail.")

NODE_HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

@app.route('/overall', methods=['POST'])
def authenticate():
    """Authenticate a person from image via multipart/form-data input and call Node server."""
    location = ""
    try:
        if 'image' not in request.files:
            logging.warning("No image file in request")
            return jsonify({"error": "No image file provided"}), 400

        image_file = request.files['image']
        location = request.form.get('location', '')
        logging.info(f"Received image: {image_file.filename}, Location: {location}")

        # Ensure a valid file extension
        _, ext = os.path.splitext(image_file.filename)
        if ext.lower() not in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
            ext = ".jpg"
            logging.info(f"Invalid extension detected, defaulting to {ext}")

        # Save uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
            image_path = tmp_file.name
            image_file.save(image_path)
        logging.info(f"Saved temp image to: {image_path}")

        # Extract metadata from image
        metadata = None
        try:
            with open(image_path, 'rb') as img_file:
                metadata_json = get_image_metadata(img_file)
                metadata = json.loads(metadata_json)
                logging.info(f"Extracted image metadata: {json.dumps(metadata, indent=2)}")
        except Exception as meta_error:
            logging.warning(f"Failed to extract metadata: {meta_error}")
            metadata = None

        # Extract embedding / name
        embedding, message = detect_and_extract_face_from_path(image_path)
        logging.info(f"Face detection message: {message}")

        result = authenticate_from_json({"image_path": image_path, "location": location})
        name = result.get("name")
        logging.info(f"Extracted Name: {name}")

        # Remove temp image
        if os.path.exists(image_path):
            os.remove(image_path)
            logging.info(f"Removed temp image file: {image_path}")

        # Prepare payload with name, location, and metadata
        payload = {
            "name": name,
            "location": location,
            "metadata": metadata
        }

        # Call Node.js server with extracted name, location, and metadata
        # Even if name is None, still call the server to get metadata in response
        try:
            node_response = requests.post(NODE_SERVER_URL, headers=NODE_HEADERS, json=payload)
            data = node_response.json()
            return jsonify(data), node_response.status_code
        except requests.exceptions.ConnectionError:
            logging.error("Failed to connect to Node.js server")
            # Return local response with metadata if Node server is down
            return jsonify({
                "name": name,
                "location": location,
                "metadata": metadata,
                "error": "OSINT service unavailable"
            }), 200
        except Exception as e:
            logging.error(f"Failed to communicate with Node server: {e}")
            # Return local response with metadata on any error
            return jsonify({
                "name": name,
                "location": location,
                "metadata": metadata,
                "error": f"OSINT service error: {str(e)}"
            }), 200

    except Exception as e:
        logging.exception("Error during authentication")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    logging.info("Starting Face Authentication API on port 5000...")
    app.run(debug=False, host='0.0.0.0', port=5000)
