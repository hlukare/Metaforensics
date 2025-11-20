import requests

# File path and location
image_path = "test1.jpeg"  # Path to your image file
location = "Nashik"

print("Testing Face Authentication API with multipart/form-data...")

try:
    # Prepare files and form data
    files = {"image": open(image_path, "rb")}
    data = {"location": location}

    # Make POST request
    response = requests.post(
        "http://localhost:5000/overall",
        files=files,
        data=data
    )

    print(f"\nStatus Code: {response.status_code}")
    print("Response:", response.json())

except FileNotFoundError:
    print(f"Error: File '{image_path}' not found.")
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to the API. Make sure the Flask server is running.")
except Exception as e:
    print(f"Error: {e}")
finally:
    # Close the file
    if 'files' in locals() and 'image' in files:
        files['image'].close()
