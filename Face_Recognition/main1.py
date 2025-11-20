from flask import Flask, request, jsonify
from authenticate_face import authenticate_from_json

app = Flask(__name__)


@app.route('/authenticate', methods=['POST'])
def authenticate():
    """Authenticate a person from image via JSON input."""
    try:
        if not request.is_json:
            return jsonify({"name": None, "location": "", "save_report": False}), 400
        
        input_data = request.get_json()
        if not input_data:
            return jsonify({"name": None, "location": "", "save_report": False}), 400
        
        result = authenticate_from_json(input_data)
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "name": None,
            "location": input_data.get("location", "") if 'input_data' in locals() else "",
            "save_report": input_data.get("save_report", False) if 'input_data' in locals() else False
        }), 500


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
