#!/bin/bash
# Master build script for all Cursor packages

echo "=========================================="
echo "Building All Cursor Packages"
echo "=========================================="
echo ""

PACKAGES=(
    "packages/types"
    "packages/utils"
    "packages/file-service"
    "packages/react-codemirror"
    "packages/ai-service"
    "packages/automations"
    "packages/rules-service"
    "packages/composer"
    "packages/agent-exec"
    "packages/semantic-indexer"
)

TOTAL_PACKAGES=${#PACKAGES[@]}
PASSED=0
FAILED=0

for package in "${PACKAGES[@]}"; do
    PACKAGE_NAME=$(basename "$package")
    echo "Building: $PACKAGE_NAME"
    echo "-----------------------------------"
    
    # Check if build.sh exists
    if [ ! -f "$package/build.sh" ]; then
        echo "❌ build.sh not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Run build script
    cd "$package"
    bash build.sh
    BUILD_RESULT=$?
    cd ../..
    
    if [ $BUILD_RESULT -eq 0 ]; then
        echo "✅ $PACKAGE_NAME built successfully"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $PACKAGE_NAME build failed"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

echo "=========================================="
echo "Build Summary"
echo "=========================================="
echo "Total packages: $TOTAL_PACKAGES"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All packages built successfully!"
    exit 0
else
    echo "❌ $FAILED package(s) failed to build"
    exit 1
fi