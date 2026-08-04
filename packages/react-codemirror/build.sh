#!/bin/bash
# Build script for react-codemirror package

echo "Building @cursor/react-codemirror..."

# Use npx to run typescript if available
if command -v npx &> /dev/null; then
    npx tsc
    if [ $? -eq 0 ]; then
        echo "Build successful!"
        echo "Output: dist/"
    else
        echo "Build failed!"
        exit 1
    fi
else
    echo "Error: npx not found. Please install Node.js and npm."
    exit 1
fi