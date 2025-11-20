from extract import get_image_metadata
import json
import sys

# Get file path from command line argument or prompt user
file_path = "one.jpg"

# Get metadata as JSON string using file handle
with open(file_path, 'rb') as f:
    json_string = get_image_metadata(f)
print(json_string)

# Parse JSON to access specific fields
metadata = json.loads(json_string)

# Safely access location data
location = metadata.get('location')
if isinstance(location, dict):
    location_name = location.get('location_name', {})
    if isinstance(location_name, dict):
        city = location_name.get('city', 'Not available')
    else:
        city = 'Not available'
else:
    city = 'Not available'

print(f"City: {city}")
print(f"Time taken: {metadata.get('time_taken', 'Not available')}")

# Safely access camera data
make = metadata.get('Make', 'Unknown')
model = metadata.get('Model', 'Unknown')
print(f"Camera: {make} {model}")