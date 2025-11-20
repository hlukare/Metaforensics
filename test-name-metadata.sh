#!/bin/bash

# Test script to verify name + metadata are returned even when face not recognized

echo "🧪 Testing Face Recognition + Metadata Integration"
echo "=================================================="
echo ""

# Check if Flask server is running
echo "📡 Checking Flask server..."
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Flask server is running on port 5000"
else
    echo "❌ Flask server not running. Start it with:"
    echo "   cd Face_Recognition"
    echo "   python3 main.py"
    exit 1
fi

echo ""
echo "📸 Testing with image..."

# Find a test image
if [ -f "metadata/one.jpg" ]; then
    TEST_IMAGE="metadata/one.jpg"
    echo "Using test image: $TEST_IMAGE"
elif [ -f "Face_Recognition/test.jpeg" ]; then
    TEST_IMAGE="Face_Recognition/test.jpeg"
    echo "Using test image: $TEST_IMAGE"
else
    echo "❌ No test image found"
    exit 1
fi

echo ""
echo "🚀 Sending request to /overall endpoint..."
echo ""

# Make request and save response
RESPONSE=$(curl -s -X POST http://localhost:5000/overall \
  -F "image=@$TEST_IMAGE" \
  -F "location=TestCity")

echo "📋 Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "=================================================="
echo ""

# Check if response contains required fields
if echo "$RESPONSE" | grep -q '"name"'; then
    echo "✅ Response contains 'name' field"
else
    echo "❌ Response missing 'name' field"
fi

if echo "$RESPONSE" | grep -q '"metadata"'; then
    echo "✅ Response contains 'metadata' field"
else
    echo "❌ Response missing 'metadata' field"
fi

if echo "$RESPONSE" | grep -q '"location"'; then
    echo "✅ Response contains 'location' field"
else
    echo "❌ Response missing 'location' field"
fi

echo ""
echo "Test complete!"
