#!/bin/bash
# Publish all packages to npm

echo "=========================================="
echo "Publishing All Cursor Packages"
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

# Check if logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

echo "✅ Logged in to npm as: $(npm whoami)"
echo ""

TOTAL_PACKAGES=${#PACKAGES[@]}
PASSED=0
FAILED=0

for package in "${PACKAGES[@]}"; do
    PACKAGE_NAME=$(basename "$package")
    echo "Publishing: $PACKAGE_NAME"
    echo "-----------------------------------"
    
    cd "$package"
    
    # Build the package
    if [ -f "build.sh" ]; then
        bash build.sh
        BUILD_RESULT=$?
        if [ $BUILD_RESULT -ne 0 ]; then
            echo "❌ Build failed for $PACKAGE_NAME"
            FAILED=$((FAILED + 1))
            cd ../..
            echo ""
            continue
        fi
    fi
    
    # Publish to npm
    if npm publish; then
        echo "✅ $PACKAGE_NAME published successfully"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $PACKAGE_NAME publish failed"
        FAILED=$((FAILED + 1))
    fi
    
    cd ../..
    echo ""
done

echo "=========================================="
echo "Publish Summary"
echo "=========================================="
echo "Total packages: $TOTAL_PACKAGES"
echo "Published: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All packages published successfully!"
    exit 0
else
    echo "❌ $FAILED package(s) failed to publish"
    exit 1
fi