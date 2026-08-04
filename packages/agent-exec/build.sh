#!/bin/bash
# Build script for agent-exec package

echo "Building @cursor/agent-exec..."

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