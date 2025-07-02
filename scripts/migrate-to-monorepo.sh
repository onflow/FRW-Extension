#!/bin/bash

# Script to help migrate FRW Extension to monorepo structure
# This script uses git mv to preserve history

set -e

echo "Starting migration to monorepo structure..."

# Function to create directory if it doesn't exist
ensure_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
    fi
}

# 1. Move background services to core package
echo "Moving background services to @frw/core package..."
ensure_dir "packages/core/src/services"
if [ -d "src/background/service" ]; then
    git mv src/background/service/* packages/core/src/services/ 2>/dev/null || echo "No services to move"
fi
if [ -d "src/background/controller" ]; then
    git mv src/background/controller/* packages/core/src/services/ 2>/dev/null || echo "No controllers to move"
fi

# 2. Move shared types to core package
echo "Moving shared types to @frw/core package..."
ensure_dir "packages/core/src/types"
if [ -d "src/shared/types" ]; then
    git mv src/shared/types/* packages/core/src/types/ 2>/dev/null || echo "No types to move"
fi

# 3. Move shared utils to core package
echo "Moving shared utils to @frw/core package..."
ensure_dir "packages/core/src/utils"
if [ -d "src/shared/utils" ]; then
    # Keep cache-related utils separate for cache package
    for file in src/shared/utils/*; do
        if [[ ! "$file" =~ "cache" ]]; then
            git mv "$file" packages/core/src/utils/ 2>/dev/null || echo "Skipping $file"
        fi
    done
fi

# 4. Move cache implementation to cache package
echo "Moving cache implementation to @frw/cache package..."
ensure_dir "packages/cache/src"
if [ -f "src/shared/utils/cache-data-access.ts" ]; then
    git mv src/shared/utils/cache-data-access.ts packages/cache/src/ 2>/dev/null || echo "Cache file already moved"
fi

# 5. Move hooks to react-hooks package
echo "Moving React hooks to @frw/react-hooks package..."
ensure_dir "packages/react-hooks/src/hooks"
if [ -d "src/ui/hooks" ]; then
    git mv src/ui/hooks/* packages/react-hooks/src/hooks/ 2>/dev/null || echo "No hooks to move"
fi

# 6. Move reducers to react-hooks package
echo "Moving reducers to @frw/react-hooks package..."
ensure_dir "packages/react-hooks/src/reducers"
if [ -d "src/ui/reducers" ]; then
    git mv src/ui/reducers/* packages/react-hooks/src/reducers/ 2>/dev/null || echo "No reducers to move"
fi

# 7. Move extension app
echo "Moving extension app to apps/extension..."
ensure_dir "apps/extension"
for item in src _raw build webpack tsconfig.json jest.config.js playwright.config.ts vitest.config.ts; do
    if [ -e "$item" ]; then
        git mv "$item" "apps/extension/" 2>/dev/null || echo "Skipping $item"
    fi
done

echo "Migration script complete! Next steps:"
echo "1. Create package.json files for each package"
echo "2. Update imports across the codebase"
echo "3. Create storage adapters"
echo "4. Test the new structure"