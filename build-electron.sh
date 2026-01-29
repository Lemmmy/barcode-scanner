#!/bin/bash
# Build script for Electron desktop app

echo -e "\033[0;36mBuilding Barcode Scanner Desktop App...\033[0m"

# Step 1: Build the web app for Electron
echo -e "\n\033[0;33m[1/4] Building web app for Electron...\033[0m"
cd web
pnpm run build:electron
if [ $? -ne 0 ]; then
    echo -e "\033[0;31mWeb build failed!\033[0m"
    exit 1
fi
cd ..

# Step 2: Install Electron dependencies
echo -e "\n\033[0;33m[2/4] Installing Electron dependencies...\033[0m"
cd electron
if [ ! -d "node_modules" ]; then
    pnpm install
fi
cd ..

# Step 3: Build Electron main process
echo -e "\n\033[0;33m[3/4] Building Electron main process...\033[0m"
cd electron
pnpm run build
if [ $? -ne 0 ]; then
    echo -e "\033[0;31mElectron build failed!\033[0m"
    exit 1
fi
cd ..

# Step 4: Package the application
echo -e "\n\033[0;33m[4/4] Packaging Windows executable...\033[0m"
cd electron
pnpm run package:win
if [ $? -ne 0 ]; then
    echo -e "\033[0;31mPackaging failed!\033[0m"
    exit 1
fi
cd ..

echo -e "\n\033[0;32mBuild complete! Executable is in electron/release/\033[0m"
