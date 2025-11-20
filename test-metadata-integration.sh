#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "🧪 Testing Image Metadata Integration"
echo "========================================="
echo ""

# Step 1: Check if metadata extraction works
echo "📋 Step 1: Testing metadata extraction..."
cd "$(dirname "$0")/metadata"
if [ -f "main.py" ] && [ -f "one.jpg" ]; then
    echo -e "${GREEN}✓${NC} Files found"
    echo "Running metadata extraction..."
    python3 main.py 2>&1 | head -20
    echo ""
else
    echo -e "${RED}✗${NC} Files missing in metadata folder"
    exit 1
fi

# Step 2: Check Face Recognition dependencies
echo "📋 Step 2: Checking Face Recognition dependencies..."
cd "../Face_Recognition"
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} requirements.txt found"
    echo "Checking if Pillow is installed..."
    python3 -c "import PIL; print('Pillow version:', PIL.__version__)" 2>&1
    echo "Checking if geopy is installed..."
    python3 -c "import geopy; print('geopy version:', geopy.__version__)" 2>&1
    echo ""
else
    echo -e "${RED}✗${NC} requirements.txt missing"
    exit 1
fi

# Step 3: Check if Flask server file is updated
echo "📋 Step 3: Checking Flask server updates..."
if grep -q "get_image_metadata" main.py; then
    echo -e "${GREEN}✓${NC} Flask server has metadata extraction import"
else
    echo -e "${RED}✗${NC} Flask server missing metadata extraction import"
fi

if grep -q '"metadata": metadata' main.py; then
    echo -e "${GREEN}✓${NC} Flask server sends metadata to Node.js"
else
    echo -e "${RED}✗${NC} Flask server not sending metadata"
fi
echo ""

# Step 4: Check Node.js server updates
echo "📋 Step 4: Checking Node.js server updates..."
cd "../osint-investigation-tool"

if grep -q "metadata" controllers/searchController.js; then
    echo -e "${GREEN}✓${NC} searchController accepts metadata"
else
    echo -e "${RED}✗${NC} searchController not accepting metadata"
fi

if grep -q "metadata" services/osintService.js; then
    echo -e "${GREEN}✓${NC} osintService handles metadata"
else
    echo -e "${RED}✗${NC} osintService not handling metadata"
fi

if grep -q "formatMetadata" services/reportFormatter.js; then
    echo -e "${GREEN}✓${NC} reportFormatter has formatMetadata method"
else
    echo -e "${RED}✗${NC} reportFormatter missing formatMetadata method"
fi
echo ""

# Step 5: Summary
echo "========================================="
echo "📊 Test Summary"
echo "========================================="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Install missing dependencies:"
echo "   cd Face_Recognition"
echo "   pip install -r requirements.txt"
echo ""
echo "2. Start Flask server:"
echo "   cd Face_Recognition"
echo "   python3 main.py"
echo ""
echo "3. Start Node.js server (in another terminal):"
echo "   cd osint-investigation-tool"
echo "   npm start"
echo ""
echo "4. Test with an image:"
echo "   curl -X POST http://localhost:5000/overall \\"
echo "     -F 'image=@/path/to/image.jpg' \\"
echo "     -F 'location=City'"
echo ""
echo "========================================="
