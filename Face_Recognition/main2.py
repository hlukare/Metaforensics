# from flask import Flask, request, jsonify
# from authenticate_face import authenticate_from_json
# import os
# import tempfile

# app = Flask(__name__)

# @app.route('/authenticate', methods=['POST'])
# def authenticate():
#     """Authenticate a person from image via multipart/form-data input."""
#     try:
#         # Check if 'image' is in the request files
#         if 'image' not in request.files:
#             return jsonify({"name": None, "location": ""}), 400

#         image_file = request.files['image']
#         location = request.form.get('location', '')

#         # Save uploaded file temporarily
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
#             image_path = tmp_file.name
#             image_file.save(image_path)

#         # Prepare input_data in dictionary format expected by authenticate_from_json
#         input_data = {
#             "image_path": image_path,
#             "location": location
#         }

#         result = authenticate_from_json(input_data)

#         # Remove temporary image file
#         if os.path.exists(image_path):
#             os.remove(image_path)

#         # Remove save_report key if exists
#         if 'save_report' in result:
#             result.pop('save_report')

#         return jsonify(result), 200

#     except Exception as e:
#         return jsonify({
#             "name": None,
#             "location": location if 'location' in locals() else ""
#         }), 500


# if __name__ == '__main__':
#     app.run(debug=False, host='0.0.0.0', port=5000)import os
import tempfile
import os
import logging
from flask import Flask, request, jsonify
from authenticate_face import authenticate_from_json, detect_and_extract_face_from_path
import cv2
import json

# Setup Flask app
app = Flask(__name__)

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

@app.route('/authenticate', methods=['POST'])
def authenticate():
    """Authenticate a person from image via multipart/form-data input with full logging."""
    location = ""
    try:
        # Check if image file is sent
        if 'image' not in request.files:
            logging.warning("No image file in request")
            return jsonify({"name": None, "location": ""}), 400

        image_file = request.files['image']
        location = request.form.get('location', '')
        logging.info(f"Received image: {image_file.filename}, Location: {location}")

        # Ensure a valid file extension
        _, ext = os.path.splitext(image_file.filename)
        if ext.lower() not in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
            ext = ".jpg"
            logging.info(f"Invalid extension detected, defaulting to {ext}")

        # Save the uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
            image_path = tmp_file.name
            image_file.save(image_path)
            tmp_file.flush()
        logging.info(f"Saved temp image to: {image_path}")

        # Test if OpenCV can read the image
        test_img = cv2.imread(image_path)
        if test_img is None:
            logging.error(f"OpenCV failed to read image at {image_path}")
        else:
            logging.info(f"Image read successfully with shape: {test_img.shape}")

        # Optional: Debug face detection and embedding directly
        embedding, message = detect_and_extract_face_from_path(image_path)
        logging.info(f"Face detection message: {message}")
        if embedding is not None:
            logging.info(f"Embedding shape: {embedding.shape}")
        else:
            logging.warning("No embedding generated")

        # Prepare data for your existing function
        input_data = {"image_path": image_path, "location": location, "save_report": False}

        # Load face database for debugging
        try:
            with open("face_database.json", 'r') as f:
                face_db = json.load(f)
            logging.info(f"Loaded face database with {len(face_db)} entries")
        except Exception as e:
            logging.error(f"Failed to load face database: {e}")
            face_db = {}

        # Call your existing authentication function
        result = authenticate_from_json(input_data)
        logging.info(f"Authentication result: {result}")

        # Remove temporary image file
        if os.path.exists(image_path):
            os.remove(image_path)
            logging.info(f"Removed temp image file: {image_path}")

        # Remove save_report key if exists (just in case)
        if 'save_report' in result:
            result.pop('save_report')

        # Return result without save_report
        return jsonify(result), 200

    except Exception as e:
        logging.exception("Error during authentication")
        return jsonify({"name": None, "location": location}), 500


if __name__ == '__main__':
    logging.info("Starting Face Authentication API on port 5000...")
    app.run(debug=False, host='0.0.0.0', port=5000)
