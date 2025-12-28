#!/bin/bash

# CAD Engine Test Script
# Tests STEP to STL conversion with sample file

echo "🔧 CAD Engine Conversion Test"
echo "=============================="
echo ""

# Check if CAD engine is running
echo "1. Checking CAD engine health..."
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)

if [ $? -eq 0 ]; then
    echo "✅ CAD Engine is running"
    echo "   $HEALTH_RESPONSE"
else
    echo "❌ CAD Engine is not accessible at http://localhost:5000"
    echo "   Start it with: docker-compose up cad-engine"
    exit 1
fi

echo ""
echo "2. Testing STEP file conversion..."

# Check if test file is provided
if [ -z "$1" ]; then
    echo "⚠️  No STEP file provided"
    echo ""
    echo "Usage: ./test-conversion.sh <path-to-step-file>"
    echo "Example: ./test-conversion.sh ../test-files/cone_clutch.stp"
    exit 1
fi

STEP_FILE="$1"

if [ ! -f "$STEP_FILE" ]; then
    echo "❌ File not found: $STEP_FILE"
    exit 1
fi

echo "   Input file: $STEP_FILE"
echo "   File size: $(du -h "$STEP_FILE" | cut -f1)"

# Convert STEP to STL
OUTPUT_FILE="output_$(date +%s).stl"
echo ""
echo "3. Converting STEP → STL..."
echo "   (This may take 5-60 seconds depending on file complexity)"

START_TIME=$(date +%s)

curl -X POST http://localhost:5000/convert/step-to-stl \
    -F "file=@$STEP_FILE" \
    -o "$OUTPUT_FILE" \
    -w "\n   HTTP Status: %{http_code}\n   Time: %{time_total}s\n" \
    --max-time 120

CURL_EXIT=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""

if [ $CURL_EXIT -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "✅ Conversion successful!"
    echo "   Output file: $OUTPUT_FILE"
    echo "   File size: $FILE_SIZE"
    echo "   Time taken: ${DURATION}s"
    echo ""
    echo "You can now:"
    echo "  - View the STL in a 3D viewer (FreeCAD, MeshLab, etc.)"
    echo "  - Upload it to your application for browser viewing"
else
    echo "❌ Conversion failed"
    echo "   Check CAD engine logs: docker-compose logs cad-engine"

    if [ -f "$OUTPUT_FILE" ]; then
        rm "$OUTPUT_FILE"
    fi

    exit 1
fi
