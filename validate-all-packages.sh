#!/bin/bash
# Master validation script for all Cursor packages

echo "=========================================="
echo "Cursor Packages Validation"
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
    echo "Validating: $PACKAGE_NAME"
    echo "-----------------------------------"
    
    # Check if package directory exists
    if [ ! -d "$package" ]; then
        echo "❌ Package directory not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Check if package.json exists
    if [ ! -f "$package/package.json" ]; then
        echo "❌ package.json not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Check if tsconfig.json exists
    if [ ! -f "$package/tsconfig.json" ]; then
        echo "❌ tsconfig.json not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Check if src directory exists
    if [ ! -d "$package/src" ]; then
        echo "❌ src directory not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Check if index.ts exists
    if [ ! -f "$package/src/index.ts" ]; then
        echo "❌ src/index.ts not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Check if README.md exists
    if [ ! -f "$package/README.md" ]; then
        echo "❌ README.md not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Check if build.sh exists
    if [ ! -f "$package/build.sh" ]; then
        echo "❌ build.sh not found"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    # Count TypeScript files
    TS_FILES=$(find "$package/src" -name "*.ts" 2>/dev/null | wc -l)
    echo "✓ TypeScript files: $TS_FILES"
    
    # Count lines of code
    LINES=$(find "$package/src" -name "*.ts" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    echo "✓ Lines of code: $LINES"
    
    echo "✅ $PACKAGE_NAME validated successfully"
    PASSED=$((PASSED + 1))
    echo ""
done

echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo "Total packages: $TOTAL_PACKAGES"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All packages validated successfully!"
    exit 0
else
    echo "❌ $FAILED package(s) failed validation"
    exit 1
fi